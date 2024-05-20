import * as d3 from "d3";
import { getPathFromLinkData, projectFlow } from "./projectPoint.js";
import { colorMap } from "../static.js";

function updateSvgPaths(map, displayTypeString) {
    const g = d3.select(map.getPanes().overlayPane).select("svg").select("g")
    const zoom = map.getZoom()

    g.selectAll("path")
        .attr("d", linkData => getPathFromLinkData(linkData, displayTypeString, map))
        .style("stroke-width", d => zoom - 6)

    d3.selectAll("[id^='marker']")
        .attr("markerWidth", zoom - 5)
        .attr("markerHeight", zoom - 5)

}

function getScales() {
    const scales = {
        "stroke-opacity": d3.scaleLinear().domain([0, 0.002]).range([0.1, 1]),
        "stroke-width": d3.scaleLinear().domain([0, 1]).range([1.3, 7]),
        "stroke": d3.scaleSequential(d3.interpolateWarm) // https://d3js.org/d3-scale-chromatic/sequential#interpolateWarm
    }

    return scales
}

function setDataSettingsOnMap(pathData, map) {
    const scales = getScales()
    const svg = d3.select(map.getPanes().overlayPane).select("svg");
    const g = svg.select("g");
    const tooltip = d3.select(".tooltip")

    const defs = d3.select(map.getPanes().overlayPane).select("svg").append("svg:defs")

    pathData.forEach(flowObj => {
        const angle = getFlowAngle(flowObj, map)
        const angleCoords = getAngleCoords(angle)

        const gradient = defs.append("linearGradient")
            .attr("id", "gradient" + flowObj.id)
            .attr("x1", angleCoords.x1)
            .attr("y1", angleCoords.y1)
            .attr("x2", angleCoords.x2)
            .attr("y2", angleCoords.y2)

        gradient.append("stop")
            .attr("offset", "0%")
            .attr("stop-color", "#008080"); // destination color

        gradient.append("stop")
            .attr("offset", "100%")
            .attr("stop-color", "#FFA500"); // origin color
    })


    g.selectAll("path") // ("path.cat" + cat)
        .data(pathData)
        .join("path")
        //.attr("class", "cat" + cat) esto
        .attr("style", "pointer-events: auto;")
        .style("stroke", d => `url(#gradient${d.id})`)
        .style("stroke-opacity", d => scales["stroke-opacity"](d.norm_total))
        .on("mouseover", function (event, d) {
            // this contiene el elemento path, event es el evento, d contiene los datos

            tooltip
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 5) + "px")
                .text(`distance: ${Number(d.distance).toFixed(2)} \n norm: ${Number(d.norm_total).toFixed(3)}`)

            tooltip.transition().duration(150).style("opacity", 0.9)

            //d3.select(this).style('stroke', '#00688B')
        })
        .on("mouseout", function (event, d) {
            tooltip.transition().duration(150).style("opacity", 0)

            //d3.select(this).style('stroke', d => colorMap[d.group]);
        })
}

function setDataSettingsOnClusteredFlowMap(pathData, map) {
    const scales = getScales()
    const colorScale = scales["stroke"]
    const g = d3.select(map.getPanes().overlayPane).select("svg").select("g")
    const tooltip = d3.select(".tooltip")

    const defs = d3.select(map.getPanes().overlayPane).select("svg").append("svg:defs")
    // limpiar defs antiguas primero para considerar los redraw?

    pathData.forEach(flowObj => {
        defs.append("svg:marker")
            .attr("id", "marker" + flowObj.id)
            .attr("viewBox", "0 0 12 12")
            .attr("refX", 9)
            .attr("refY", 6)
            .attr("markerWidth", 7)
            .attr("markerHeight", 7)
            .attr("fill", colorScale(flowObj.index))
            .attr("orient", getFlowAngle(flowObj, map)) // auto hace que cambien de orientacion al cambiar el size
            .append("svg:path")
            .attr("d", "M2,2 L10,6 L2,10 L6,6 L2,2")
            .attr("opacity", scales["stroke-opacity"](flowObj.normTotal))
    })

    g.selectAll("path") // ("path.cat" + cat)
        .data(pathData)
        .join("path")
        //.attr("class", "cat" + cat) esto
        .attr("style", "pointer-events: auto;")
        .attr("marker-end", d => `url(#marker${d.id})`)
        .style("stroke", d => colorScale(d.index))
        .style("stroke-opacity", d => scales["stroke-opacity"](d.normTotal))//(d.normalized_total))
        .style("stroke-width", d => 3)
        .style("fill", `url(line-gradient)`)
        .on("mouseover", function (event, d) {
            // this contiene el elemento path, event es el evento, d contiene los datos

            tooltip
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 5) + "px")
                .text(`index: ${Number(d.index).toFixed(2)}`)

            tooltip.transition().duration(150).style("opacity", 0.9)

            d3.select(this).style('stroke', '#00688B')
        })
        .on("mouseout", function (event, d) {
            tooltip.transition().duration(150).style("opacity", 0)

            d3.select(this).style('stroke', d => colorScale(d.index));
        })
}

function getFlowAngle(flowObj, map) {
    const { start, end } = projectFlow(flowObj, map)

    const dx = end.x - start.x
    const dy = end.y - start.y

    // Use arctangent to get the angle in radians
    const angleInRadians = Math.atan2(dy, dx)

    // Optionally convert to degrees if needed
    const angleInDegrees = angleInRadians * 180 / Math.PI

    return angleInDegrees;
}

function getAngleCoords(angle) {
    var anglePI = (angle) * (Math.PI / 180);
    var angleCoords = {
        'x1': Math.round(50 + Math.sin(anglePI) * 50) + '%',
        'y1': Math.round(50 + Math.cos(anglePI) * 50) + '%',
        'x2': Math.round(50 + Math.sin(anglePI + Math.PI) * 50) + '%',
        'y2': Math.round(50 + Math.cos(anglePI + Math.PI) * 50) + '%',
    }
    return angleCoords
}

export { updateSvgPaths, setDataSettingsOnMap, setDataSettingsOnClusteredFlowMap, getScales }