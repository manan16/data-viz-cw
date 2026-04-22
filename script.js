const regionByCountry = new Map(Object.entries({
    Afghanistan: "Asia", Albania: "Europe", Algeria: "Africa", Angola: "Africa", Armenia: "Asia",
    Azerbaijan: "Asia", Bangladesh: "Asia", Belarus: "Europe", Benin: "Africa", Bhutan: "Asia",
    Bolivia: "Americas", "Bosnia and Herzegovina": "Europe", Botswana: "Africa", Brazil: "Americas",
    "Burkina Faso": "Africa", Burundi: "Africa", Cambodia: "Asia", Cameroon: "Africa", Chad: "Africa",
    China: "Asia", Colombia: "Americas", Comoros: "Africa", "Costa Rica": "Americas",
    "Cote d'Ivoire": "Africa", Cuba: "Americas", "Dominican Republic": "Americas", Ecuador: "Americas",
    Egypt: "Africa", "El Salvador": "Americas", "Equatorial Guinea": "Africa", Eritrea: "Africa",
    Eswatini: "Africa", Ethiopia: "Africa", Gabon: "Africa", Gambia: "Africa", Georgia: "Asia",
    Ghana: "Africa", Guatemala: "Americas", Guinea: "Africa", Guyana: "Americas", Haiti: "Americas",
    Honduras: "Americas", India: "Asia", Indonesia: "Asia", Iraq: "Asia", Jordan: "Asia",
    Kazakhstan: "Asia", Kenya: "Africa", Kiribati: "Oceania", Kuwait: "Asia", Kyrgyzstan: "Asia",
    Lebanon: "Asia", Lesotho: "Africa", Liberia: "Africa", Madagascar: "Africa", Malawi: "Africa",
    Malaysia: "Asia", Maldives: "Asia", Mali: "Africa", Mauritania: "Africa", Mauritius: "Africa",
    Mexico: "Americas", Moldova: "Europe", Mongolia: "Asia", Montenegro: "Europe", Morocco: "Africa",
    Mozambique: "Africa", Myanmar: "Asia", Namibia: "Africa", Nepal: "Asia", Nicaragua: "Americas",
    Niger: "Africa", Nigeria: "Africa", "North Macedonia": "Europe", Pakistan: "Asia", Panama: "Americas",
    "Papua New Guinea": "Oceania", Paraguay: "Americas", Peru: "Americas", Philippines: "Asia",
    Rwanda: "Africa", Samoa: "Oceania", "Saudi Arabia": "Asia", Senegal: "Africa", Serbia: "Europe",
    "Sierra Leone": "Africa", "South Africa": "Africa", "South Sudan": "Africa", Sudan: "Africa",
    Suriname: "Americas", Syria: "Asia", Tajikistan: "Asia", Tanzania: "Africa", Thailand: "Asia",
    Togo: "Africa", Tonga: "Oceania", Tunisia: "Africa", Turkmenistan: "Asia", Uganda: "Africa",
    Ukraine: "Europe", Uruguay: "Americas", Uzbekistan: "Asia", Vanuatu: "Oceania", Vietnam: "Asia",
    Yemen: "Asia", Zambia: "Africa", Zimbabwe: "Africa"
}));

const modeCopy = {
    scatter: {
        heading: "Wealth and Literacy Relationship",
        helper: "Use the year slider and world-region filter to compare patterns, identify outliers, and see how the relationship changes over time.",
        countLabel: "countries shown",
        noteLabel: "Trend line:",
        description: [
            "This scatter plot shows the relationship between national wealth and adult literacy across countries. Each point represents one country in the selected year.",
            "Countries further to the right are wealthier, while countries higher up have stronger literacy outcomes. The dashed regression line summarises the overall direction of the current relationship."
        ],
        read: [
            ["Lower-left", "lower wealth and lower literacy."],
            ["Upper-right", "higher wealth and higher literacy."],
            ["Above the line", "higher literacy than the trend predicts."],
            ["Below the line", "lower literacy than expected for the wealth level."],
            ["Interaction", "click a region in the legend or search for a country to focus the view."]
        ]
    },
    box: {
        heading: "Literacy Distribution by Wealth Group",
        helper: "Compare low-wealth, medium-wealth, and high-wealth country groups for the selected year and region.",
        countLabel: "countries grouped",
        noteLabel: "Distribution note:",
        description: [
            "This box plot compares the distribution of adult literacy rates across low-wealth, medium-wealth, and high-wealth country groups in the selected year.",
            "It helps reveal differences in median literacy, variability, and outliers across wealth bands rather than focusing only on individual country positions."
        ],
        read: [
            ["Box", "the middle 50% of literacy values, from Q1 to Q3."],
            ["Median line", "the typical literacy value for the group."],
            ["Whiskers", "the lowest and highest non-outlier values."],
            ["Outlier points", "countries unusually far from their wealth group's distribution."],
            ["Interaction", "click a wealth group or median chip to focus that distribution."]
        ]
    }
};

const elements = {
    chart: d3.select("#chart"),
    tooltip: d3.select("#tooltip"),
    descriptionBody: d3.select("#descriptionBody"),
    readList: d3.select("#readList"),
    chartHeading: d3.select("#chartHeading"),
    chartHelper: d3.select("#chartHelper"),
    explanationSection: d3.select(".explanation-section"),
    explanationToggle: d3.select("#explanationToggle"),
    yearSlider: d3.select("#yearSlider"),
    yearValue: d3.select("#yearValue"),
    regionFilter: d3.select("#regionFilter"),
    countrySearch: d3.select("#countrySearch"),
    countryOptions: d3.select("#countryOptions"),
    countrySearchControl: d3.select(".country-search-control"),
    resetButton: d3.select("#resetButton"),
    modeButtons: d3.selectAll(".mode-button"),
    countryCount: d3.select("#countryCount"),
    countLabel: d3.select("#countLabel"),
    modeNoteLabel: d3.select("#modeNoteLabel"),
    emptyState: d3.select("#emptyState"),
    medianSummary: d3.select("#medianSummary"),
    medianValues: d3.select("#medianValues"),
    trendSummary: d3.select("#trendSummary"),
    legend: d3.select("#legend"),
    insights: d3.select("#insights")
};

const margin = { top: 58, right: 36, bottom: 78, left: 82 };
const width = 1120 - margin.left - margin.right;
const height = 660 - margin.top - margin.bottom;
const transitionDuration = 550;
const wealthGroups = [
    { id: "Low wealth", min: 0, max: 33 },
    { id: "Medium wealth", min: 33, max: 66 },
    { id: "High wealth", min: 66, max: 100.01 }
];

const regionColor = d3.scaleOrdinal()
    .domain(["Africa", "Asia", "Europe", "Americas", "Oceania", "Unknown"])
    .range(["#ef4444", "#14b8a6", "#2563eb", "#ec4899", "#8b5cf6", "#94a3b8"]);

const requestedMode = new URLSearchParams(window.location.search).get("mode");
const state = {
    mode: ["scatter", "box"].includes(requestedMode) ? requestedMode : "box",
    data: [],
    initialYear: null,
    focusRegion: null,
    highlightedCountry: "",
    focusedWealthGroup: null
};

const svg = elements.chart.append("svg")
    .attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
    .attr("preserveAspectRatio", "xMidYMid meet");
const chart = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

d3.csv("final_dataset.csv", parseRow)
    .then(rows => {
        state.data = aggregateCountryYears(rows.filter(isValidRow));
        state.initialYear = getInitialYear(state.data);
        initialiseControls();
        update();
    })
    .catch(error => {
        console.error(error);
        elements.emptyState
            .property("hidden", false)
            .text("The CSV file could not be loaded. Run this page with a local static server and keep final_dataset.csv beside index.html.");
    });

function initialiseControls() {
    const years = uniqueSorted(state.data.map(d => d.year), d3.ascending);
    const regions = uniqueSorted(state.data.map(d => d.region), sortRegions);

    elements.yearSlider
        .attr("min", d3.min(years))
        .attr("max", d3.max(years))
        .attr("step", 1)
        .property("value", state.mode === "box" ? getBestBoxYear("All") : state.initialYear);

    elements.regionFilter.selectAll("option.region-option")
        .data(regions)
        .join("option")
        .attr("class", "region-option")
        .attr("value", d => d)
        .text(d => d);

    elements.countryOptions.selectAll("option")
        .data(uniqueSorted(state.data.map(d => d.country), d3.ascending))
        .join("option")
        .attr("value", d => d);

    elements.explanationToggle.on("click", toggleExplanation);
    elements.yearSlider.on("input", update);
    elements.regionFilter.on("change", () => {
        state.focusRegion = null;
        state.highlightedCountry = "";
        state.focusedWealthGroup = null;
        elements.countrySearch.property("value", "");
        if (state.mode === "box" && !hasEnoughBoxData(Number(elements.yearSlider.property("value")), elements.regionFilter.property("value"))) {
            elements.yearSlider.property("value", getBestBoxYear(elements.regionFilter.property("value")));
        }
        update();
    });
    elements.modeButtons.on("click", function() {
        state.mode = d3.select(this).attr("data-mode");
        state.focusRegion = null;
        state.highlightedCountry = "";
        state.focusedWealthGroup = null;
        elements.countrySearch.property("value", "");
        history.replaceState(null, "", `?mode=${state.mode}`);
        if (state.mode === "box" && !hasEnoughBoxData(Number(elements.yearSlider.property("value")), elements.regionFilter.property("value"))) {
            elements.yearSlider.property("value", getBestBoxYear(elements.regionFilter.property("value")));
        }
        update();
    });
    elements.countrySearch.on("input", function() {
        state.highlightedCountry = cleanText(this.value);
        update();
    });
    elements.resetButton.on("click", () => {
        state.mode = "box";
        state.focusRegion = null;
        state.highlightedCountry = "";
        state.focusedWealthGroup = null;
        elements.countrySearch.property("value", "");
        history.replaceState(null, "", window.location.pathname);
        elements.regionFilter.property("value", "All");
        elements.yearSlider.property("value", getBestBoxYear("All"));
        update();
    });
}

function update() {
    const year = Number(elements.yearSlider.property("value"));
    const region = elements.regionFilter.property("value");
    const filtered = filterByYearRegion(year, region);

    elements.yearValue.text(year);
    updateSliderProgress();
    updateModeUi();
    updateDescription();
    clearChart();

    if (state.mode === "scatter") renderScatterPlot(filtered, year, region);
    if (state.mode === "box") renderBoxPlot(filtered, year, region);
}

function parseRow(d) {
    return {
        country: cleanText(d.country),
        sourceRegion: cleanText(d.region),
        year: Number(d.year),
        wealth: Number(d.wealth_iwi),
        literacy: Number(d.adult_literacy_rate)
    };
}

function cleanText(value) {
    return String(value ?? "").trim();
}

function isValidRow(d) {
    return d.country &&
        Number.isFinite(d.year) &&
        Number.isFinite(d.wealth) &&
        Number.isFinite(d.literacy) &&
        d.wealth >= 0 && d.wealth <= 100 &&
        d.literacy >= 0 && d.literacy <= 100;
}

function aggregateCountryYears(rows) {
    const grouped = d3.rollups(
        rows,
        values => ({
            country: values[0].country,
            year: values[0].year,
            region: regionByCountry.get(values[0].country) || "Unknown",
            wealth: d3.mean(values, d => d.wealth),
            literacy: d3.mean(values, d => d.literacy),
            sourceAreas: new Set(values.map(d => d.sourceRegion).filter(Boolean)).size
        }),
        d => d.country,
        d => d.year
    );

    return grouped
        .flatMap(([, years]) => years.map(([, value]) => value))
        .filter(d => Number.isFinite(d.wealth) && Number.isFinite(d.literacy))
        .sort((a, b) => d3.ascending(a.country, b.country) || d3.ascending(a.year, b.year));
}

function renderScatterPlot(filtered, year, region) {
    updateMedianSummary(null);
    const regression = calculateRegression(filtered);
    const { xScale, yScale } = drawLinearAxes("Mean International Wealth Index (0-100)", "Adult literacy rate (%)", "Countries by wealth and adult literacy");

    chart.append("g").selectAll("circle")
        .data(filtered, d => d.country)
        .join("circle")
        .attr("class", "data-point")
        .attr("cx", d => xScale(d.wealth))
        .attr("cy", d => yScale(d.literacy))
        .attr("r", 0)
        .attr("fill", d => regionColor(d.region))
        .attr("stroke", "#ffffff")
        .attr("stroke-width", 1.1)
        .attr("opacity", 0.84)
        .classed("is-muted", d => isScatterMuted(d))
        .classed("is-selected", d => isHighlightedCountry(d))
        .on("mouseenter", function(event, d) {
            chart.selectAll(".data-point").classed("is-muted", p => p.country !== d.country);
            d3.select(this).raise().classed("is-muted", false).transition().duration(140).attr("r", 8).attr("stroke", "#1f2737").attr("stroke-width", 2);
            showTooltip(event, scatterTooltip(d, regression));
        })
        .on("mousemove", moveTooltip)
        .on("mouseleave", function() {
            applyScatterFocus();
            d3.select(this).transition().duration(140).attr("r", d => isHighlightedCountry(d) ? 8 : 5.8).attr("stroke", d => isHighlightedCountry(d) ? "#1f2737" : "#ffffff").attr("stroke-width", d => isHighlightedCountry(d) ? 2.4 : 1.1);
            hideTooltip();
        })
        .on("click", function(event, d) {
            state.highlightedCountry = state.highlightedCountry === d.country ? "" : d.country;
            elements.countrySearch.property("value", state.highlightedCountry);
            applyScatterFocus();
        })
        .transition()
        .duration(transitionDuration)
        .attr("r", d => isHighlightedCountry(d) ? 8 : 5.8);

    drawTrendLine(filtered, regression, xScale, yScale);
    renderRegionLegend(uniqueSorted(filtered.map(d => d.region), sortRegions));
    updateScatterText(filtered, regression, year, region);
}

function renderBoxPlot(filtered, year, region) {
    const stats = wealthGroups.map(group => computeBoxStats(group, filtered));
    updateMedianSummary(stats);
    const xScale = d3.scaleBand().domain(wealthGroups.map(d => d.id)).range([0, width]).paddingInner(0.32).paddingOuter(0.18);
    const yScale = d3.scaleLinear().domain([0, 100]).range([height, 0]);

    drawCategoricalAxes(xScale, yScale, "Wealth group", "Adult literacy rate (%)", "Literacy distribution by wealth group");

    const plot = chart.append("g").attr("class", "box-layer");
    const groups = plot.selectAll(".box-group")
        .data(stats, d => d.id)
        .join("g")
        .attr("class", "box-group")
        .classed("is-muted", d => state.focusedWealthGroup && state.focusedWealthGroup !== d.id)
        .classed("is-focused", d => state.focusedWealthGroup === d.id)
        .attr("transform", d => `translate(${xScale(d.id)},0)`);

    groups.each(function(d) {
        const group = d3.select(this);
        const center = xScale.bandwidth() / 2;
        const boxWidth = Math.min(120, xScale.bandwidth() * 0.64);

        group.on("click", () => {
            state.focusedWealthGroup = state.focusedWealthGroup === d.id ? null : d.id;
            update();
        });

        if (!d.enough) {
            group.append("text")
                .attr("x", center)
                .attr("y", height / 2)
                .attr("text-anchor", "middle")
                .attr("class", "start-end-label")
                .text(`${d.count} ${d.count === 1 ? "country" : "countries"}`);
            return;
        }

        group.append("line")
            .attr("class", "whisker-line")
            .attr("x1", center).attr("x2", center)
            .attr("y1", yScale(d.median)).attr("y2", yScale(d.median))
            .on("mouseenter", event => showTooltip(event, boxTooltip(d)))
            .on("mousemove", moveTooltip)
            .on("mouseleave", hideTooltip)
            .transition().duration(transitionDuration)
            .attr("y1", yScale(d.min)).attr("y2", yScale(d.max));

        group.append("line").attr("class", "whisker-line").attr("x1", center - boxWidth / 3).attr("x2", center + boxWidth / 3).attr("y1", yScale(d.min)).attr("y2", yScale(d.min));
        group.append("line").attr("class", "whisker-line").attr("x1", center - boxWidth / 3).attr("x2", center + boxWidth / 3).attr("y1", yScale(d.max)).attr("y2", yScale(d.max));

        group.append("rect")
            .attr("class", "box-fill")
            .attr("x", center - boxWidth / 2)
            .attr("width", boxWidth)
            .attr("y", yScale(d.median))
            .attr("height", 0)
            .on("mouseenter", event => showTooltip(event, boxTooltip(d)))
            .on("mousemove", moveTooltip)
            .on("mouseleave", hideTooltip)
            .transition().duration(transitionDuration)
            .attr("y", yScale(d.q3))
            .attr("height", Math.max(1, yScale(d.q1) - yScale(d.q3)));

        group.append("line")
            .attr("class", "median-line")
            .attr("x1", center - boxWidth / 2)
            .attr("x2", center + boxWidth / 2)
            .attr("y1", yScale(d.median))
            .attr("y2", yScale(d.median));

        group.selectAll(".outlier-point")
            .data(d.outliers)
            .join("circle")
            .attr("class", "outlier-point")
            .attr("cx", (_, i) => center + ((i % 5) - 2) * 5)
            .attr("cy", p => yScale(p.literacy))
            .attr("r", 0)
            .on("mouseenter", (event, p) => showTooltip(event, outlierTooltip(p, d.id)))
            .on("mousemove", moveTooltip)
            .on("mouseleave", hideTooltip)
            .transition().duration(transitionDuration)
            .attr("r", 4.8);
    });

    renderBoxLegend();
    updateBoxText(stats, filtered, year, region);
}

function drawLinearAxes(xLabel, yLabel, title) {
    const xScale = d3.scaleLinear().domain([0, 100]).range([0, width]);
    const yScale = d3.scaleLinear().domain([0, 100]).range([height, 0]);
    drawGridAndAxes(xScale, yScale, d3.axisBottom(xScale).ticks(5), d3.axisLeft(yScale).ticks(5).tickFormat(d => `${d}%`));
    drawLabels(xLabel, yLabel, title);
    return { xScale, yScale };
}

function drawCategoricalAxes(xScale, yScale, xLabel, yLabel, title) {
    drawGridAndAxes(xScale, yScale, d3.axisBottom(xScale), d3.axisLeft(yScale).ticks(5).tickFormat(d => `${d}%`));
    drawLabels(xLabel, yLabel, title);
}

function drawGridAndAxes(xScale, yScale, xAxisGenerator, yAxisGenerator) {
    chart.append("g").attr("class", "grid").attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(xScale).ticks ? d3.axisBottom(xScale).ticks(5).tickSize(-height).tickFormat("") : d3.axisBottom(xScale).tickSize(-height).tickFormat(""));
    chart.append("g").attr("class", "grid")
        .call(d3.axisLeft(yScale).ticks(5).tickSize(-width).tickFormat(""));
    chart.append("g").attr("class", "axis").attr("transform", `translate(0,${height})`).call(xAxisGenerator);
    chart.append("g").attr("class", "axis").call(yAxisGenerator);
}

function drawLabels(xLabel, yLabel, title) {
    chart.append("text").attr("class", "chart-title").attr("x", width / 2).attr("y", -22).attr("text-anchor", "middle").text(title);
    chart.append("text").attr("class", "axis-label").attr("x", width / 2).attr("y", height + 52).attr("text-anchor", "middle").text(xLabel);
    chart.append("text").attr("class", "axis-label").attr("transform", "rotate(-90)").attr("x", -height / 2).attr("y", -52).attr("text-anchor", "middle").text(yLabel);
}

function calculateRegression(values) {
    if (values.length < 2) return null;
    const n = values.length;
    const sumX = d3.sum(values, d => d.wealth);
    const sumY = d3.sum(values, d => d.literacy);
    const sumXY = d3.sum(values, d => d.wealth * d.literacy);
    const sumXX = d3.sum(values, d => d.wealth * d.wealth);
    const denominator = n * sumXX - sumX * sumX;
    if (Math.abs(denominator) < 1e-9) return null;
    const slope = (n * sumXY - sumX * sumY) / denominator;
    const intercept = (sumY - slope * sumX) / n;
    const meanX = sumX / n;
    const meanY = sumY / n;
    const covariance = d3.sum(values, d => (d.wealth - meanX) * (d.literacy - meanY));
    const varianceX = d3.sum(values, d => (d.wealth - meanX) ** 2);
    const varianceY = d3.sum(values, d => (d.literacy - meanY) ** 2);
    const correlation = varianceX && varianceY ? covariance / Math.sqrt(varianceX * varianceY) : 0;
    return { slope, intercept, correlation };
}

function drawTrendLine(filtered, regression, xScale, yScale) {
    if (!regression || filtered.length < 2) return;
    const extent = d3.extent(filtered, d => d.wealth);
    if (extent[0] === extent[1]) return;
    const lineData = extent.map(x => ({ x, y: Math.max(0, Math.min(100, regression.slope * x + regression.intercept)) }));
    chart.append("path")
        .datum(lineData)
        .attr("class", "trend-line")
        .attr("d", d3.line().x(d => xScale(d.x)).y(d => yScale(d.y)))
        .attr("opacity", 0)
        .transition().duration(transitionDuration)
        .attr("opacity", 1);
}

function computeBoxStats(group, rows) {
    const values = rows.filter(d => d.wealth >= group.min && d.wealth < group.max).sort((a, b) => d3.ascending(a.literacy, b.literacy));
    const literacy = values.map(d => d.literacy);
    if (values.length < 3) return { id: group.id, count: values.length, enough: false, values, outliers: [] };

    // D3's quantile helper computes the quartiles used for the box.
    const q1 = d3.quantile(literacy, 0.25);
    const median = d3.quantile(literacy, 0.5);
    const q3 = d3.quantile(literacy, 0.75);
    const iqr = q3 - q1;
    const lowerFence = q1 - 1.5 * iqr;
    const upperFence = q3 + 1.5 * iqr;
    const nonOutliers = values.filter(d => d.literacy >= lowerFence && d.literacy <= upperFence);
    const outliers = values.filter(d => d.literacy < lowerFence || d.literacy > upperFence);

    return {
        id: group.id,
        count: values.length,
        enough: true,
        q1,
        median,
        q3,
        min: d3.min(nonOutliers, d => d.literacy),
        max: d3.max(nonOutliers, d => d.literacy),
        spread: d3.max(nonOutliers, d => d.literacy) - d3.min(nonOutliers, d => d.literacy),
        values,
        outliers
    };
}

function updateDescription() {
    const copy = modeCopy[state.mode];
    elements.chartHeading.text(copy.heading);
    elements.chartHelper.text(copy.helper);
    elements.countLabel.text(copy.countLabel);
    elements.modeNoteLabel.text(copy.noteLabel);
    elements.descriptionBody.selectAll("p")
        .data(copy.description)
        .join("p")
        .text(d => d);
    elements.readList.selectAll("li")
        .data(copy.read)
        .join("li")
        .html(d => `<strong>${d[0]}:</strong> ${d[1]}`);
}

function updateModeUi() {
    elements.modeButtons.classed("is-active", function() {
        return d3.select(this).attr("data-mode") === state.mode;
    });
    elements.countrySearchControl.classed("is-hidden", state.mode !== "scatter");
}

function updateSliderProgress() {
    const min = Number(elements.yearSlider.attr("min"));
    const max = Number(elements.yearSlider.attr("max"));
    const value = Number(elements.yearSlider.property("value"));
    const progress = max > min ? ((value - min) / (max - min)) * 100 : 100;
    elements.yearSlider.style("--slider-progress", `${Math.max(0, Math.min(100, progress))}%`);
}

function toggleExplanation() {
    const isOpen = elements.explanationSection.classed("is-open");
    elements.explanationSection.classed("is-open", !isOpen);
    elements.explanationToggle.attr("aria-expanded", String(!isOpen));
}

function updateScatterText(filtered, regression, year, region) {
    elements.countryCount.text(filtered.length);
    elements.emptyState.property("hidden", filtered.length >= 2);
    if (!regression || filtered.length < 2) {
        elements.trendSummary.text(`There are too few valid observations to calculate a trend for ${regionLabel(region)} in ${year}.`);
    } else {
        const direction = regression.slope > 0.08 ? "positive" : regression.slope < -0.08 ? "negative" : "weak";
        const strength = Math.abs(regression.correlation) >= 0.65 ? "strong" : Math.abs(regression.correlation) >= 0.35 ? "moderate" : "limited";
        elements.trendSummary.text(`For ${regionLabel(region)} in ${year}, the trend is ${direction}, with ${strength} correlation (r = ${formatNumber(regression.correlation)}).`);
    }

    if (!filtered.length) return updateInsightCards([{ title: "No data shown", text: "Try another year or return to all regions." }]);
    const richest = d3.greatest(filtered, d => d.wealth);
    const highestLiteracy = d3.greatest(filtered, d => d.literacy);
    const outlier = regression ? filtered
        .map(d => ({ ...d, residual: d.literacy - (regression.slope * d.wealth + regression.intercept) }))
        .sort((a, b) => Math.abs(b.residual) - Math.abs(a.residual))[0] : null;
    updateInsightCards([
        { title: "Overall pattern", text: regression ? `The visible pattern ${Math.abs(regression.correlation) >= 0.35 ? "supports" : "only weakly supports"} a wealth-literacy association for ${regionLabel(region)} in ${year}.` : "A regression line needs at least two countries with different wealth values." },
        { title: "Highest values", text: `${richest.country} has the highest wealth score shown (${formatNumber(richest.wealth)}), while ${highestLiteracy.country} has the highest literacy rate (${formatNumber(highestLiteracy.literacy)}%).` },
        { title: "Possible outlier", text: outlier ? `${outlier.country} sits ${Math.abs(outlier.residual).toFixed(1)} percentage points ${outlier.residual >= 0 ? "above" : "below"} the trend line.` : "Select a broader region to compare countries against the trend line." }
    ]);
}

function updateBoxText(stats, filtered, year, region) {
    elements.countryCount.text(filtered.length);
    const enoughStats = stats.filter(d => d.enough);
    elements.emptyState.property("hidden", enoughStats.length > 0);
    elements.trendSummary.text(enoughStats.length
        ? `For ${regionLabel(region)} in ${year}, compare medians and box heights to see whether literacy outcomes rise and become less variable across wealth groups.`
        : `There are too few valid observations to build box plots for ${regionLabel(region)} in ${year}.`);

    if (!enoughStats.length) return updateInsightCards([{ title: "Not enough grouped data", text: "Try all regions or another year for a clearer distribution." }]);
    const medians = enoughStats.map(d => `${d.id}: ${formatNumber(d.median)}%`).join("; ");
    const widest = d3.greatest(enoughStats, d => d.spread);
    const outlier = enoughStats.flatMap(d => d.outliers.map(p => ({ ...p, group: d.id }))).sort((a, b) => d3.descending(Math.abs(a.literacy - 50), Math.abs(b.literacy - 50)))[0];
    updateInsightCards([
        { title: "Median literacy", text: medians },
        { title: "Widest spread", text: `${widest.id} has the widest non-outlier spread, from ${formatNumber(widest.min)}% to ${formatNumber(widest.max)}%.` },
        { title: "Notable outlier", text: outlier ? `${outlier.country} is an outlier in the ${outlier.group} group at ${formatNumber(outlier.literacy)}%.` : "No statistical outliers are visible in the selected groups." }
    ]);
}

function updateMedianSummary(stats) {
    elements.medianSummary.classed("is-hidden", !stats);
    if (!stats) return;

    const values = stats.map(d => ({
        label: d.id,
        value: d.enough ? `${Math.round(d.median)}%` : "not enough data"
    }));

    elements.medianValues.selectAll(".median-value")
        .data(values, d => d.label)
        .join("div")
        .attr("class", "median-value")
        .classed("is-focused", d => state.focusedWealthGroup === d.label)
        .html(d => `${d.label} &rarr; <span>${d.value}</span>`)
        .on("click", (_, d) => {
            state.focusedWealthGroup = state.focusedWealthGroup === d.label ? null : d.label;
            update();
        });
}

function updateInsightCards(cards) {
    elements.insights.selectAll(".insight")
        .data(cards)
        .join("div")
        .attr("class", "insight")
        .html(d => `<strong>${d.title}</strong><p>${d.text}</p>`);
}

function renderRegionLegend(regions) {
    elements.legend.html("");
    elements.legend.append("div").attr("class", "legend-title").text("Region");
    elements.legend.selectAll(".legend-item")
        .data(regions.length ? regions : regionColor.domain())
        .join("div")
        .attr("class", d => {
            const isMuted = state.focusRegion && state.focusRegion !== d;
            const isActive = state.focusRegion === d;
            return `legend-item is-clickable${isMuted ? " is-muted" : ""}${isActive ? " is-active" : ""}`;
        })
        .html(d => `<span class="legend-swatch" style="background:${regionColor(d)}"></span><span>${d}</span>`)
        .on("click", (_, region) => {
            state.focusRegion = state.focusRegion === region ? null : region;
            update();
        });
}

function renderBoxLegend() {
    elements.legend.html(`
        <div class="legend-title">Box plot</div>
        <div class="legend-item"><span class="legend-swatch" style="background:rgba(124, 92, 255, 0.15);border:1px solid #7c5cff"></span><span>Q1 to Q3</span></div>
        <div class="legend-item"><span class="legend-swatch" style="background:#3b4cca"></span><span>Median</span></div>
        <div class="legend-item"><span class="legend-swatch" style="background:#e18652"></span><span>Outliers</span></div>
    `);
}

function filterByYearRegion(year, region) {
    return state.data.filter(d => d.year === year && (region === "All" || d.region === region));
}

function getInitialYear(data) {
    const countsByYear = d3.rollups(data, values => values.length, d => d.year).sort((a, b) => d3.descending(a[0], b[0]));
    const latestUsefulYear = countsByYear.find(([, count]) => count >= 20);
    return latestUsefulYear ? latestUsefulYear[0] : d3.max(data, d => d.year);
}

function getBestBoxYear(region) {
    const years = uniqueSorted(state.data.map(d => d.year), d3.descending);
    return years.find(year => hasEnoughBoxData(year, region)) || state.initialYear;
}

function hasEnoughBoxData(year, region) {
    const rows = filterByYearRegion(year, region);
    return wealthGroups.some(group =>
        rows.filter(d => d.wealth >= group.min && d.wealth < group.max).length >= 3
    );
}

function clearChart() {
    hideTooltip();
    chart.selectAll("*").remove();
}

function applyScatterFocus() {
    chart.selectAll(".data-point")
        .classed("is-muted", d => isScatterMuted(d))
        .classed("is-selected", d => isHighlightedCountry(d))
        .attr("stroke", d => isHighlightedCountry(d) ? "#1f2737" : "#ffffff")
        .attr("stroke-width", d => isHighlightedCountry(d) ? 2.4 : 1.1)
        .transition()
        .duration(160)
        .attr("r", d => isHighlightedCountry(d) ? 8 : 5.8);
}

function isScatterMuted(d) {
    const regionMuted = state.focusRegion && d.region !== state.focusRegion;
    const countryMuted = state.highlightedCountry && !isHighlightedCountry(d);
    return Boolean(regionMuted || countryMuted);
}

function isHighlightedCountry(d) {
    return state.highlightedCountry &&
        d.country.toLowerCase() === state.highlightedCountry.toLowerCase();
}

function scatterTooltip(d, regression) {
    const expected = regression ? regression.slope * d.wealth + regression.intercept : null;
    const rows = [
        ["Region", d.region],
        ["Year", d.year],
        ["Wealth IWI", formatNumber(d.wealth)],
        ["Adult literacy", `${formatNumber(d.literacy)}%`],
        ["Source areas", d.sourceAreas]
    ];
    if (Number.isFinite(expected)) rows.push(["Against trend", `${formatNumber(d.literacy - expected)} pts`]);
    return tooltipTemplate(d.country, rows);
}

function boxTooltip(d) {
    return tooltipTemplate(d.id, [
        ["Countries", d.count],
        ["Min non-outlier", `${formatNumber(d.min)}%`],
        ["Q1", `${formatNumber(d.q1)}%`],
        ["Median", `${formatNumber(d.median)}%`],
        ["Q3", `${formatNumber(d.q3)}%`],
        ["Max non-outlier", `${formatNumber(d.max)}%`]
    ]);
}

function outlierTooltip(d, group) {
    return tooltipTemplate(d.country, [
        ["Outlier group", group],
        ["Year", d.year],
        ["Wealth IWI", formatNumber(d.wealth)],
        ["Adult literacy", `${formatNumber(d.literacy)}%`]
    ]);
}

function tooltipTemplate(title, rows) {
    return `
        <strong>${title}</strong>
        <div class="tooltip-rows">
            ${rows.map(([label, value]) => `<div class="tooltip-row"><span>${label}</span><b>${value}</b></div>`).join("")}
        </div>
    `;
}

function showTooltip(event, html) {
    elements.tooltip.classed("visible", true).html(html);
    moveTooltip(event);
}

function moveTooltip(event) {
    const node = elements.tooltip.node();
    const offset = 16;
    const width = node?.offsetWidth || 300;
    const height = node?.offsetHeight || 180;
    const pageLeft = event.pageX + offset;
    const pageTop = event.pageY - 18;
    const maxLeft = window.scrollX + window.innerWidth - width - 12;
    const minLeft = window.scrollX + 12;
    const maxTop = window.scrollY + window.innerHeight - height - 12;
    const minTop = window.scrollY + 12;

    elements.tooltip
        .style("left", `${Math.max(minLeft, Math.min(maxLeft, pageLeft))}px`)
        .style("top", `${Math.max(minTop, Math.min(maxTop, pageTop))}px`);
}

function hideTooltip() {
    elements.tooltip.classed("visible", false);
}

function regionLabel(region) {
    return region === "All" ? "all regions" : region;
}

function formatNumber(value) {
    return d3.format(".1f")(value);
}

function uniqueSorted(values, comparator) {
    return Array.from(new Set(values)).sort(comparator);
}

function sortRegions(a, b) {
    const order = ["Africa", "Asia", "Europe", "Americas", "Oceania", "Unknown"];
    return d3.ascending(order.indexOf(a), order.indexOf(b));
}
