const url = "film.json"
let data = []
let originalData = [];
let currentData = []; 
const searchInput = document.getElementById('search-input');
const tableContainer = document.getElementById('table-container');

async function fetchData() {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        originalData = await response.json();
        if (!Array.isArray(originalData)) throw new Error("Invalid data format");
        if (originalData.length === 0) throw new Error("Empty dataset");
        
        currentData = [...originalData];
        createTable(currentData);
        createTopDirectorsChart();
        createTopFilmsByIdChart()
    } catch (error) {
        console.error("Error:", error);
        tableContainer.innerHTML = `<div class="error">${error.message}</div>`;
    }
}

function createTable(data) {
    tableContainer.innerHTML = '';

    const table = document.createElement('table');
    const thead = document.createElement('thead');
    const tbody = document.createElement('tbody');

    const headers = ['id', 'title', 'release_year', 'director', 'box_office', 'country'];
    const headerRow = document.createElement('tr');
    
    headers.forEach(headerText => {
        const th = document.createElement('th');
        th.textContent = headerText;
        th.setAttribute('data-sortable', 'true');
        th.setAttribute('data-column', headerText);
        headerRow.appendChild(th);
    });

    thead.appendChild(headerRow);
    table.appendChild(thead);

    data.forEach(item => {
        const row = document.createElement('tr');

        const idCell = document.createElement('td');
        idCell.textContent = item.id;

        const titleCell = document.createElement('td');
        titleCell.textContent = item.title;

        const yearCell = document.createElement('td');
        yearCell.textContent = item.release_year;

        const directorCell = document.createElement('td');
        directorCell.textContent = item.director;

        const box_officeCell = document.createElement('td');
        box_officeCell.textContent = item.box_office;

        const countryCell = document.createElement('td');
        countryCell.textContent = item.country;

        row.append(idCell, titleCell, yearCell, directorCell, box_officeCell, countryCell);
        tbody.appendChild(row);
    });

    table.appendChild(tbody);
    tableContainer.appendChild(table);

    document.querySelectorAll('th[data-sortable]').forEach(header => {
        header.addEventListener('click', (e) => {
            const column = header.dataset.column.toLowerCase();
            
            switch(column) {
                case 'id':
                    currentData.sort((a, b) => a.id - b.id);
                    break;
                case 'title':
                    currentData.sort((a, b) => a.title.localeCompare(b.title));
                    break;
                case 'release_year':
                    currentData.sort((a, b) => a.release_year - b.release_year);
                    break;
                case 'director':
                    currentData.sort((a, b) => 
                        String(a.director || "").localeCompare(String(b.director || ""))
                    );
                    break;
                case 'box_office':
                    currentData.sort((a, b) => 
                        -(Number(a.box_office.replace(/,/g, "")) || 0) + (Number(b.box_office.replace(/,/g, "")) || 0)
                    );
                    break;
                case 'country':
                    currentData.sort((a, b) => 
                        String(a.country || "").localeCompare(String(b.country || ""))
                    );
                    break;
            }
            createTable(currentData);
        });
    });
}

function filterDataByTitleAndDirector(searchTerm) {
    const term = searchTerm.toLowerCase().trim();
    currentData = originalData.filter(item => {
        const title = String(item.title).toLowerCase();
        const director = String(item.director).toLowerCase();
        return title.includes(term) || director.includes(term);
    });
    createTable(currentData);
}

if (searchInput) {
    searchInput.addEventListener('input', (event) => {
        const searchTerm = event.target.value;
        filterDataByTitleAndDirector(searchTerm);
    });
}

function createTopDirectorsChart() {
    d3.select("#directors-chart").html("");

    const directorsData = {};
    originalData.forEach(movie => {
        const director = movie.director ? String(movie.director).trim() : "Unknown";
        directorsData[director] = (directorsData[director] || 0) + 1;
    });

    const topDirectors = Object.entries(directorsData)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);

    const width = 800;
    const height = 400;
    const margin = { top: 20, right: 30, bottom: 100, left: 60 };

    const svg = d3.select("#directors-chart")
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    const x = d3.scaleBand()
        .domain(topDirectors.map(d => d[0]))
        .range([margin.left, width - margin.right])
        .padding(0.2);

    const y = d3.scaleLinear()
        .domain([0, d3.max(topDirectors, d => d[1])])
        .range([height - margin.bottom, margin.top]);

    svg.selectAll("rect")
        .data(topDirectors)
        .enter()
        .append("rect")
        .attr("class", "chart-bar")
        .attr("fill", "#4CAF50")
        .attr("fill-opacity", 0.75)
        .attr("x", d => x(d[0]))
        .attr("y", d => y(d[1]))
        .attr("width", x.bandwidth())
        .attr("height", d => height - margin.bottom - y(d[1]))
        .on("mouseover", function(event, d) {
            d3.select(this).attr("stroke", "#000").attr("stroke-width", 2);
            showTooltip(event, d);
        })
        .on("mouseout", function() {
            d3.select(this).attr("stroke", "none");
            hideTooltip();
        });

    svg.append("g")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(x))
        .selectAll("text")
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "end");

    svg.append("g")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y).ticks(10, "d"));

    const tooltip = d3.select("body")
        .append("div")
        .attr("class", "tooltip")
        .style("opacity", 0)
        .style("position", "absolute")
        .style("background", "white")
        .style("padding", "8px")
        .style("border", "1px solid #ddd");

    function showTooltip(event, d) {
        tooltip
            .html(`Director: ${d[0]}<br>Movies: ${d[1]}`)
            .style("left", `${event.pageX + 15}px`)
            .style("top", `${event.pageY + 15}px`)
            .style("opacity", 1);
    }

    function hideTooltip() {
        tooltip.style("opacity", 0);
    }
    
    
}

function createTopFilmsByIdChart() {
    d3.select("#films-id-chart").html("");

    const filmsData = {};
    originalData.forEach(movie => {
        const filmId = movie.id;
        const filmTitle = movie.title;
        const boxOffice = parseFloat(movie.box_office.replace(/,/g, "")) || 0;

        filmsData[filmId] = { title: filmTitle, boxOffice: boxOffice };
    });

    const topFilms = Object.entries(filmsData)
        .sort((a, b) => b[1].boxOffice - a[1].boxOffice)
        .slice(0, 10);

    const width = 800;
    const height = 400;
    const margin = { top: 20, right: 30, bottom: 100, left: 60 };

    const svg = d3.select("#films-id-chart")
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    const x = d3.scaleBand()
        .domain(topFilms.map(d => d[1].title))
        .range([margin.left, width - margin.right])
        .padding(0.035);

    const minBoxOffice = d3.min(topFilms, d => d[1].boxOffice);
    const yMin = minBoxOffice * 0.3;
    const yMax = d3.max(topFilms, d => d[1].boxOffice) * 1.3;

    const y = d3.scaleLinear()
        .domain([yMin, yMax])
        .range([height - margin.bottom, margin.top]);

    svg.selectAll("rect")
        .data(topFilms)
        .enter()
        .append("rect")
        .attr("class", "chart-bar")
        .attr("fill", "#FF5722")
        .attr("fill-opacity", 0.75)
        .attr("x", d => x(d[1].title))
        .attr("y", d => y(d[1].boxOffice))
        .attr("width", x.bandwidth())
        .attr("height", d => height - margin.bottom - y(d[1].boxOffice))
        .on("mouseover", function(event, d) {
            d3.select(this).attr("stroke", "#000").attr("stroke-width", 2);
            showTooltip(event, d);
        })
        .on("mouseout", function() {
            d3.select(this).attr("stroke", "none");
            hideTooltip();
        });

    svg.append("g")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(x))
        .selectAll("text")
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "end");

    svg.append("g")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y)
            .ticks(10, "s") 
            .tickFormat(d3.format(".1s")));

    const tooltip = d3.select("body")
        .append("div")
        .attr("class", "tooltip")
        .style("opacity", 0)
        .style("position", "absolute")
        .style("background", "white")
        .style("padding", "8px")
        .style("border", "1px solid #ddd");

    function showTooltip(event, d) {
        tooltip
            .html(`Film: ${d[1].title}<br>Box Office: $${(d[1].boxOffice / 1000000).toFixed(1)}M`)
            .style("left", `${event.pageX + 15}px`)
            .style("top", `${event.pageY + 15}px`)
            .style("opacity", 1);
    }

    function hideTooltip() {
        tooltip.style("opacity", 0);
    }
}











document.addEventListener('DOMContentLoaded', () => {
    fetchData();
});
