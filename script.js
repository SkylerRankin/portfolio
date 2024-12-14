// Enables debug UI
const debug = false;

const controls = {
    seed: debug ? 2 : Date.now(),
    vehicleCount: 100,
    largeVehicleOdds: 0.4,
    frameRateQueueSize: 100,
    reactionTimeSeconds: 0.5,
    velocityHistoryLength: 200,
    minEntranceDelay: 10,
    maxEntranceDelay: 1000,
}

const vehicleColors = [
    "#747474",
    "#525d75",
    "#5e5e5e",
    "#52755a",
    "#473431"
];

const vehicleSizes = {
    "normal": [
        { width: 5, height: 2 },
        { width: 6, height: 3 },
        { width: 7, height: 3 },
        { width: 8, height: 4 },
    ],
    "large": [
        { width: 9, height: 4 },
        { width: 10, height: 4 },
        { width: 22, height: 4 },
    ]
};

const elements = {
    canvas: undefined,
    renderContext: undefined,
    framerate: undefined,
    updateTime: undefined,
    renderTime: undefined
}

const state = {
    frameStats: [],
    currentFPS: 0,
    previousStepTimestamp: undefined,
    mapProximity: {
        current: [],
        next: []
    },
    vehicles: [],
    vehicleCount: 0,
    velocityHistory: Array(controls.velocityHistoryLength).fill(Array(controls.vehicleCount).fill(0)),
    availableVehicleIndices: [],
    entranceDelays: {},
    intersections: {},
    pathToIntersection: {}
}

const length = v => Math.sqrt(Math.pow(v.x, 2) + Math.pow(v.y, 2));
const distance = (x0, y0, x1, y1) => Math.sqrt(Math.pow(x0 - x1, 2) + Math.pow(y0 - y1, 2));
const quadBezier = (p0, p1, p2, t) => {
    return {
        x: (1 - t) * ((1 - t) * p0.x + t * p1.x) + t * ((1 - t) * p1.x + t * p2.x),
        y: (1 - t) * ((1 - t) * p0.y + t * p1.y) + t * ((1 - t) * p1.y + t * p2.y)
    }
}
const getBezierT = (p0, p1, p2, t, distance) => {
    // Given distance and existing t, returns the new t value that moves a length of distance along the given curve.
    // TODO: cache these two vectors in a table
    const v1 = {
        x: 2 * p0.x - 4 * p1.x + 2 * p2.x,
        y: 2 * p0.y - 4 * p1.y + 2 * p2.y
    };
    const v2 = {
        x: -2 * p0.x + 2 * p1.x,
        y: -2 * p0.y + 2 * p1.y
    };
    return t + distance / length({
        x: t * v1.x + v2.x,
        y: t * v1.y + v2.y
    });
}
const getBezierTangent = (p0, p1, p2, t) => {
    const v1 = {
        x: 2 * p0.x - 4 * p1.x + 2 * p2.x,
        y: 2 * p0.y - 4 * p1.y + 2 * p2.y
    };
    const v2 = {
        x: -2 * p0.x + 2 * p1.x,
        y: -2 * p0.y + 2 * p1.y
    };
    const v = {
        x: t * v1.x + v2.x,
        y: t * v1.y + v2.y
    };
    const l = length(v);
    return { x: v.x / l, y: v.y / l }
}
const getBezierAngle = (p0, p1, p2, t, referenceVector) => {
    const tangent = getBezierTangent(p0, p1, p2, t);
    const dot = tangent.x * referenceVector.x + tangent.y * referenceVector.y;
    const cos = dot / (length(tangent) * length(referenceVector));
    let radians = Math.acos(cos);
    if (tangent.y < 0) radians *= -1;
    return radians;
}
const mulberry32 = (a) => {
    return function() {
      var t = a += 0x6D2B79F5;
      t = Math.imul(t ^ t >>> 15, t | 1);
      t ^= t + Math.imul(t ^ t >>> 7, t | 61);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }
}
const rng = mulberry32(controls.seed);
// Min and max are inclusive
const randomInt = (min, max) => min + Math.floor((max - min + 1) * rng());
const randomFloat = (min, max) => min + (max - min + 1) * rng();
const rotateCtxForRect = (ctx, angle, x, y) => {
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.translate(-x, -y);
}

const init = () => {
    elements.canvas = document.getElementById("canvas");
    elements.renderContext = elements.canvas.getContext("2d");
    elements.framerate = document.getElementById("framerate");
    elements.updateTime = document.getElementById("updateTime");
    elements.renderTime = document.getElementById("renderTime");

    if (!debug) {
        elements.framerate.style.display = "none";
        elements.updateTime.style.display = "none";
        elements.renderTime.style.display = "none";
    }

    for (let i = 0; i < controls.frameRateQueueSize; i++) {
        state.frameStats.push({
            elapsed: 0,
            updateMS: 0,
            renderMS: 0
        });
    }

    state.previousStepTimestamp = 0;

    for (let i = 0; i < map.length; i++) {
        state.mapProximity.current.push(new Set());
        state.mapProximity.next.push(new Set());
    }

    // Create the intersection mapping
    map.forEach((mapPoint, mapPointIndex) => {
        mapPoint.connections.forEach(connection => {
            if (connection.intersectionGroup) {
                const startPoint = mapPointIndex;
                const endPoint = connection.mapPoint;
                const pathKey = `${startPoint}-${endPoint}`;
                state.pathToIntersection[pathKey] = connection.intersectionGroup;
                if (!state.intersections[connection.intersectionGroup]) {
                    state.intersections[connection.intersectionGroup] = {
                        configuration: intersectionConfigurations[connection.intersectionGroup],
                        currentElapsed: 0,
                        currentConfig: 0,
                    };
                }
            }
        });
    });

    entranceNodes.forEach(e => state.entranceDelays[e.index] = randomFloat(controls.minEntranceDelay, controls.maxEntranceDelay));
}

const getNextVehicleIndex = vehicleIndex => {
    const vehicle = state.vehicles[vehicleIndex];

    let candidateVehicles = [];
    for (let i = vehicle.currentPathIndex; i < vehicle.path.length - 1; i++) {
        const vehiclesAtPathPoint = [...state.mapProximity.current[vehicle.path[i]]];
        if (vehiclesAtPathPoint.length > 0) {
            vehiclesAtPathPoint.forEach(v => {
                const otherVehicle = state.vehicles[v];
                const atSamePathPoint = otherVehicle.path[otherVehicle.currentPathIndex] == vehicle.path[vehicle.currentPathIndex];
                
                // Don't consider the current vehicle
                if (v == vehicleIndex) return;

                // Don't consider vehicles behind the current vehicle
                if (atSamePathPoint && otherVehicle.mapPointProgress <= vehicle.mapPointProgress) return;
                
                // Don't consider vehicles that are headed on a different path
                let j = vehicle.currentPathIndex;
                while (j < vehicle.path.length && vehicle.path[j] != otherVehicle.path[otherVehicle.currentPathIndex]) {
                    j++;
                }
                if (vehicle.path[j + 1] != otherVehicle.path[otherVehicle.currentPathIndex + 1]) return;

                candidateVehicles.push(v);
            });
        }
        if (candidateVehicles.length > 0) break;
    }

    const closest = candidateVehicles.reduce((prev, curr) => {
        if (state.vehicles[prev].mapPointProgress > state.vehicles[curr].mapPointProgress) {
            return curr;
        } else {
            return prev;
        }
    }, candidateVehicles[0]);

    return closest;
}

const getVehicleDelayedSpeed = vehicleIndex => {
    const frameDelay = Math.floor(state.currentFPS * controls.reactionTimeSeconds);
    if (frameDelay > state.velocityHistory.length) {
        throw Error(`frame delay larger than velocity history: delay=${frameDelay}, fps=${state.currentFPS}, reaction time = ${controls.reactionTimeSeconds}`);
    } else {
        return state.velocityHistory[frameDelay][vehicleIndex];
    }
}

const getUpcomingIntersectionName = vehicleIndex => {
    const vehicle = state.vehicles[vehicleIndex];
    const key = `${vehicle.path[vehicle.currentPathIndex]}-${vehicle.path[vehicle.currentPathIndex + 1]}`;
    return state.pathToIntersection[key];
}

const addNewVehicle = elapsed => {
    if (state.vehicleCount == controls.vehicleCount) {
        return;
    }

    // All vehicles with a given entrance node as their current path node must be at least
    // this far progressed before a new vehicle can be added on that path.
    const progressThreshold = 0.10;

    let candidateEntrances = [];
    entranceNodes.forEach(e => {
        state.entranceDelays[e.index] -= elapsed;
        if (state.entranceDelays[e.index] > 0) return;

        state.entranceDelays[e.index] = randomFloat(controls.minEntranceDelay, controls.maxEntranceDelay);

        const nearbyVehicles = [...state.mapProximity.current[e.index]];
        let isAvailable = true;
        for (let i = 0; i < nearbyVehicles.length; i++) {
            if (state.vehicles[nearbyVehicles[i]].mapPointProgress < progressThreshold) {
                isAvailable = false;
                break;
            }
        }

        if (isAvailable) candidateEntrances.push(e.index);
    });

    if (candidateEntrances.length == 0) return;

    let largeVehicle = randomFloat(0, 1) < controls.largeVehicleOdds;
    if (largeVehicle) {
        largeVehicleCandidateEntrances = candidateEntrances.filter(i => entranceNodes.find(e => e.index == i).allowLargeVehicles);
        if (largeVehicleCandidateEntrances.length > 0) {
            candidateEntrances = largeVehicleCandidateEntrances;
        } else {
            largeVehicle = false;
        }
    }

    const vehicleSizeOptions = largeVehicle ? vehicleSizes["large"] : vehicleSizes["normal"];

    const entranceNode = candidateEntrances[randomInt(0, candidateEntrances.length - 1)];
    const paths = largeVehicle ?
        mapPathsByEntrance[entranceNode].filter(e => e.allowLargeVehicles) :
        mapPathsByEntrance[entranceNode];
    const vehicle = {
        id: 0,
        color: vehicleColors[randomInt(0, vehicleColors.length - 1)],
        size: vehicleSizeOptions[randomInt(0, vehicleSizeOptions.length - 1)],
        mapPointProgress: 0,
        path: paths[randomInt(0, paths.length - 1)].path,
        currentPathIndex: 0,
        position: { x: map[entranceNode].x, y: map[entranceNode].y },
        speed: 0,
        maxSpeed: 0.03,
        intersectionApproachSpeed: 0.005,
        acceleration: 0.001,
    };

    if (state.availableVehicleIndices.length > 0) {
        vehicle.id = state.availableVehicleIndices.shift();
        state.vehicles[vehicle.id] = vehicle;
    } else {
        vehicle.id = state.vehicles.length;
        state.vehicles.push(vehicle);
    }
    state.vehicleCount += 1;

    state.mapProximity.current[vehicle.path[0]].add(vehicle.id);
    state.mapProximity.next[vehicle.path[1]].add(vehicle.id);
}

const removeVehicle = vehicleIndex => {
    const vehicle = state.vehicles[vehicleIndex];
    state.vehicles[vehicleIndex] = undefined;
    state.availableVehicleIndices.push(vehicleIndex);

    const currentMapPoint = vehicle.path[vehicle.currentPathIndex];
    const nextMapPoint = vehicle.path[vehicle.currentPathIndex + 1];
    state.mapProximity.current[currentMapPoint].delete(vehicleIndex);
    state.mapProximity.next[nextMapPoint].delete(vehicleIndex);
    state.vehicleCount -= 1;
}

const updateVehicleSpeed = (vehicleIndex, nextVehicleIndex, nextVehicleDistance, approachingIntersection, upcomingIntersectionName) => {
    const vehicle = state.vehicles[vehicleIndex];

    // With no vehicle or intersection ahead, speed up towards max speed.
    if (nextVehicleIndex == undefined && !approachingIntersection) {
        vehicle.speed = Math.min(vehicle.maxSpeed, vehicle.speed + vehicle.acceleration);
        return;
    }

    const intersection = approachingIntersection ? state.intersections[upcomingIntersectionName] : undefined;
    const intersectionPathKey = `${vehicle.path[vehicle.currentPathIndex]}-${vehicle.path[vehicle.currentPathIndex + 1]}`;
    
    if (approachingIntersection) {
        const intersectionClosed = !intersection.configuration[intersection.currentConfig].openLanes.includes(intersectionPathKey);
        const distanceToIntersection = distance(
            vehicle.position.x,
            vehicle.position.y,
            map[vehicle.path[vehicle.currentPathIndex + 1]].x,
            map[vehicle.path[vehicle.currentPathIndex + 1]].y
        );

        const automaticBreakDistance = 1 + vehicle.size.width / 2;
        const slowDistance = 20;

        // TODO: improve the slow down logic. Maybe approximate break deceleration based on straight-line-path to intersection
        if (intersectionClosed && distanceToIntersection < automaticBreakDistance) {
            vehicle.speed = 0;
        } else if (intersectionClosed && distanceToIntersection < slowDistance) {
            // Vehicle is close enough to slow down, but should not stop entirely.
            vehicle.speed = Math.max(vehicle.intersectionApproachSpeed, vehicle.speed - vehicle.acceleration);
        } else {
            vehicle.speed = Math.min(vehicle.maxSpeed, vehicle.speed + vehicle.acceleration);
        }
    } else if (nextVehicleIndex != undefined) {
        const nextVehicleDelayedSpeed = getVehicleDelayedSpeed(nextVehicleIndex);
        const automaticBreakDistance = 3 + state.vehicles[nextVehicleIndex].size.width / 2 + vehicle.size.width / 2;
        const automaticAccelerateDistance = 40;

        if (nextVehicleDistance < automaticBreakDistance) {
            vehicle.speed = 0;
        } else if (nextVehicleDistance < automaticAccelerateDistance) {
            if (vehicle.speed < nextVehicleDelayedSpeed) {
                vehicle.speed = Math.min(vehicle.maxSpeed, Math.min(nextVehicleDelayedSpeed, vehicle.speed + vehicle.acceleration));
            } else if (vehicle.speed > nextVehicleDelayedSpeed) {
                vehicle.speed = Math.max(nextVehicleDelayedSpeed, vehicle.speed - vehicle.acceleration);
            }
        } else {
            vehicle.speed = Math.min(vehicle.maxSpeed, vehicle.speed + vehicle.acceleration);
        }
    }
}

const updateVelocityHistory = () => {
    const history = [];
    state.vehicles.forEach(vehicle => {
        if (vehicle != undefined) history.push(vehicle.speed)
    });
    state.velocityHistory.unshift(history);
    state.velocityHistory.pop();
}

const updateIntersections = elapsed => {
    for (const [name, intersection] of Object.entries(state.intersections)) {
        intersection.currentElapsed += elapsed;

        const config = intersection.configuration[intersection.currentConfig];

        if (intersection.currentElapsed >= config.openTime) {
            intersection.currentConfig = (intersection.currentConfig + 1) % Object.keys(intersection.configuration).length;
            intersection.currentElapsed = 0;
        }
    };
}

const update = elapsed => {
    state.vehicles.forEach((vehicle, vehicleIndex) => {
        if (vehicle == undefined) return;

        const nextVehicleIndex = getNextVehicleIndex(vehicleIndex);
        const nextVehicle = nextVehicleIndex == undefined ? undefined : state.vehicles[nextVehicleIndex];
        const nextVehicleDistance = nextVehicleIndex == undefined ? undefined :
            distance(vehicle.position.x, vehicle.position.y, nextVehicle.position.x, nextVehicle.position.y);
        const upcomingIntersection = getUpcomingIntersectionName(vehicleIndex);
        const approachingIntersection = upcomingIntersection != undefined &&
            (nextVehicleIndex == undefined || nextVehicle.currentPathIndex != vehicle.currentPathIndex);

        // Update vehicle speed and current state
        updateVehicleSpeed(vehicleIndex, nextVehicleIndex, nextVehicleDistance, approachingIntersection, upcomingIntersection);

        const currentMapPoint = vehicle.path[vehicle.currentPathIndex];
        const nextMapPoint = vehicle.path[vehicle.currentPathIndex + 1];

        // Update vehicle position and progress towards next map point
        if (vehicle.mapPointProgress >= 1) {
            // Vehicle has reached the next map point. Either delete the vehicle if its
            // at the end of its path, or move to the next map point.
            if (map[nextMapPoint].type == "exit") {
                removeVehicle(vehicleIndex);
            } else {
                state.mapProximity.current[currentMapPoint].delete(vehicleIndex);
                state.mapProximity.next[nextMapPoint].delete(vehicleIndex);
                state.mapProximity.current[nextMapPoint].add(vehicleIndex);

                vehicle.mapPointProgress = 0;
                vehicle.currentPathIndex += 1;
                vehicle.position.x = map[vehicle.path[vehicle.currentPathIndex]].x;
                vehicle.position.y = map[vehicle.path[vehicle.currentPathIndex]].y;
                state.mapProximity.next[vehicle.path[vehicle.currentPathIndex + 1]].add(vehicleIndex);
            }
        } else if (vehicle.speed > 0 && (nextVehicleDistance == undefined || nextVehicleDistance > 10)) {
            // Vehicle is moving towards the next map point.
            const connection = map[currentMapPoint].connections.find(x => x.mapPoint == nextMapPoint);
            const distance = vehicle.speed * elapsed;

            vehicle.mapPointProgress = getBezierT(map[currentMapPoint], connection.controlPoint, map[connection.mapPoint], vehicle.mapPointProgress, distance);

            const newPosition = quadBezier(
                map[currentMapPoint],
                connection.controlPoint,
                map[connection.mapPoint],
                vehicle.mapPointProgress
            );
            vehicle.position.x = newPosition.x;
            vehicle.position.y = newPosition.y;
        }
    });

    updateVelocityHistory();
    addNewVehicle(elapsed);
    updateIntersections(elapsed);
}

const render = () => {
    const ctx = elements.renderContext;
    ctx.clearRect(0, 0, 1000, 500);

    ctx.globalAlpha = 0.75;

    // Render vehicles
    ctx.font = "8px sans-serif";
    state.vehicles.forEach((vehicle, vehicleIndex) => {
        if (vehicle == undefined) return;

        const currentMapPoint = vehicle.path[vehicle.currentPathIndex];
        const nextMapPoint = vehicle.path[vehicle.currentPathIndex + 1];
        const connection = map[currentMapPoint].connections.find(x => x.mapPoint == nextMapPoint);

        ctx.fillStyle = vehicle.color;
        const a = getBezierAngle(
            map[currentMapPoint],
            connection.controlPoint,
            map[nextMapPoint],
            vehicle.mapPointProgress,
            { x: 1, y: 0 }
        );
        const rectWidth = vehicle.size.width;
        const rectHeight = vehicle.size.height;
        rotateCtxForRect(ctx, a, vehicle.position.x, vehicle.position.y, rectWidth, rectHeight);
        ctx.fillRect(vehicle.position.x - rectWidth / 2, vehicle.position.y - rectHeight / 2, rectWidth, rectHeight);
        ctx.resetTransform();

        ctx.fillStyle = "#000000";
        
        if (debug) {
            ctx.fillText(`${vehicleIndex}`, vehicle.position.x + rectWidth, vehicle.position.y + rectHeight);

            const v = getBezierTangent(
                map[currentMapPoint],
                connection.controlPoint,
                map[nextMapPoint],
                vehicle.mapPointProgress
            );
            v.x *= 100;
            v.y *= 100;
            ctx.strokeStyle = "#ff0000";
            ctx.beginPath();
            ctx.moveTo(vehicle.position.x, vehicle.position.y);
            ctx.lineTo(vehicle.position.x + v.x, vehicle.position.y + v.y);
            ctx.stroke();

            ctx.strokeStyle = "#ff0000";
            ctx.beginPath();
            ctx.moveTo(vehicle.position.x, vehicle.position.y);
            ctx.lineTo(vehicle.position.x + 100, vehicle.position.y);
            ctx.stroke();
        }
    
        // Render proximity debug lines
        const nextVehicleIndex = getNextVehicleIndex(vehicleIndex);
        if (nextVehicleIndex != undefined) {
            const nextVehicleDistance = distance(
                state.vehicles[vehicleIndex].position.x,
                state.vehicles[vehicleIndex].position.y,
                state.vehicles[nextVehicleIndex].position.x,
                state.vehicles[nextVehicleIndex].position.y
            );
            if (nextVehicleDistance < 25) {
                ctx.strokeStyle = "#ff0000";
            } else if (nextVehicleDistance < 100) {
                ctx.strokeStyle = "#b58c1d";
            } else {
                ctx.strokeStyle = "#5ab51d";
            }

            if (debug) {
                ctx.beginPath();
                ctx.moveTo(vehicle.position.x, vehicle.position.y);
                ctx.lineTo(state.vehicles[nextVehicleIndex].position.x, state.vehicles[nextVehicleIndex].position.y);
                ctx.stroke();
            }
        }
    });

    // Render map points
    map.forEach((point, pointIndex) => {
        if (debug) {
            ctx.fillStyle = "#34eb74";
            ctx.beginPath();
            ctx.arc(point.x, point.y, 5, 0, 2 * Math.PI);
            ctx.fill();

            // Render the point index
            ctx.fillStyle = "#000000";
            ctx.fillText(pointIndex, point.x + 5, point.y);
        }


        if (debug) {
            // Render proximity text
            ctx.fillStyle = "#000000";
            const currentText = [...state.mapProximity.current[pointIndex]].reduce((prev, curr) => prev + curr + ", ", "current: ");
            const nextText = [...state.mapProximity.next[pointIndex]].reduce((prev, curr) => prev + curr + ", ", "next: ");
            ctx.fillText(currentText, point.x, point.y);
            ctx.fillText(nextText, point.x, point.y + 15);

            // Render control points
            ctx.fillStyle = "#d4d4d4";
            point.connections.forEach(connection => {
                ctx.beginPath();
                ctx.arc(connection.controlPoint.x, connection.controlPoint.y, 3, 0, 2 * Math.PI);
                ctx.fill();
            });
        }
    });
}

const updateStats = (elapsed, updateMS, renderMS) => {
    state.frameStats.shift();
    state.frameStats.push({
        elapsed: elapsed,
        updateMS: updateMS,
        renderMS: renderMS
    });
    let totalElapsed = 0, totalUpdate = 0, totalRender = 0;
    state.frameStats.forEach(stats => {
        totalElapsed += stats.elapsed;
        totalUpdate += stats.updateMS;
        totalRender += stats.renderMS;
    });

    state.currentFPS = Math.min(1 / (totalElapsed / state.frameStats.length / 1000), 240);
    elements.framerate.innerHTML = (state.currentFPS).toPrecision(5);
    elements.updateTime.innerHTML = (totalUpdate / state.frameStats.length).toPrecision(5);
    elements.renderTime.innerHTML = (totalRender / state.frameStats.length).toPrecision(5);
}

const animationStep = timestamp => {
    const elapsed = Math.min(1000, timestamp - state.previousStepTimestamp);
    state.previousStepTimestamp = timestamp;

    const updateStart = performance.now();
    update(elapsed);
    const updateEnd = performance.now();
    render();
    const renderEnd = performance.now();

    if (debug) updateStats(elapsed, updateEnd - updateStart, renderEnd - updateEnd);

    if (!state.paused) {
        window.requestAnimationFrame(animationStep);
    }
}

window.onload = () => {
    init();
    window.requestAnimationFrame(animationStep);
}
