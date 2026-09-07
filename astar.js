function heuristic(a, b, nodes) {
    if (!nodes[a] || !nodes[b]) return 0;
    const dx = nodes[a].x - nodes[b].x;
    const dy = nodes[a].y - nodes[b].y;

    return Math.sqrt(dx * dx + dy * dy);
}

function astar(graph, nodes, start, goal) {
    if (!nodes[start] || !nodes[goal]) return null;

    const openSet = [start];
    const cameFrom = {};
    const gScore = {};
    const fScore = {};

    Object.keys(nodes).forEach(node => {
        gScore[node] = Infinity;
        fScore[node] = Infinity;
    });

    gScore[start] = 0;
    fScore[start] = heuristic(start, goal, nodes);

    while (openSet.length > 0) {
        openSet.sort((a, b) => fScore[a] - fScore[b]);
        const current = openSet.shift();

        if (current === goal) {
            const path = [];
            let temp = current;

            while (temp) {
                path.unshift(temp);
                temp = cameFrom[temp];
            }

            return {
                path,
                distance: gScore[goal]
            };
        }

        const neighbors = graph[current] || [];
        for (const neighbor of neighbors) {
            const tentativeG = gScore[current] + neighbor.cost;

            if (tentativeG < (gScore[neighbor.node] ?? Infinity)) {
                cameFrom[neighbor.node] = current;
                gScore[neighbor.node] = tentativeG;
                fScore[neighbor.node] =
                    tentativeG + heuristic(neighbor.node, goal, nodes);

                if (!openSet.includes(neighbor.node)) {
                    openSet.push(neighbor.node);
                }
            }
        }
    }

    return null;
}

module.exports = astar;