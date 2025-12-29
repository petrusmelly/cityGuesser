const BASE_ZOOM = 7
const MAX_ZOOM_IN_HINTS = 5;
const MAX_ZOOM_OUT_HINTS = 5;
const ZOOM_IN_COST = 1;
const ZOOM_OUT_COST = 1;
const POINTS_PER_CORRECT = 5;
const FIRST_LETTER_COST = 3;
let cityLayer = null;

// Leaflet map
const map = L.map('map', {zoomControl: false}).setView([42, -88], BASE_ZOOM);

// Game start conditions -- scroll and pan locked!
map.scrollWheelZoom.disable();
map.doubleClickZoom.disable();
map.keyboard.disable();
map.dragging.disable();

// City Data
const allData = "USA Major Citi_FeaturesToJSO.geojson"

// Level Logic -- we have 123 cities. We want 10 cities per "level", L = 0 starts here b/c of 0 indexing
// let currentLevel = 0;
// const perLevel = 10;
// const startLevel = currentLevel * perLevel;
// const endLevel = startLevel + perLevel;
// const levelFeatures = geojson.features.slice(startLevel, endLevel);

// Grabbing a few cities by name, then loading them into the map
// "loadFirstTen" is a relic of of early testing when we just sliced the first 10
async function loadFirstTen() {
    const res = await fetch(allData);
    const geojson = await res.json();

    const chosenCities = new Set([
        "Chicago",
        "New York",
        "Los Angeles",
        "Anchorage",
        "Phoenix",
        "Memphis",
        "Detroit",
        "Santa Fe",
        "Honolulu",
        "Nashville",
        "Austin",
        "Albuquerque",
        "Minneapolis",
        "Boston",
        "Pittsburgh"
    ]);

    const selectedCities = geojson.features.filter(f => chosenCities.has(f.properties?.NAME)
);

    return {
        type: "FeatureCollection",
        features: selectedCities
    };
};

// function for loading 10 random cities at a time into a new game
// get a random set of 10, shuffle them
function getRandomSubset(array, n) {
    const copy = array.slice();
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]]; // fisher-yates shuffle
    }
    return copy.slice(0, n);
}

async function loadNewTen() {
    const res = await fetch(allData);
    const geojson = await res.json();
    
    const randomTen = getRandomSubset(geojson.features, 10);
    
    return {
        type: "FeatureCollection",
        features: randomTen
    };
};

// Tile layer added to the map so we see some geography. 
L.tileLayer('https://basemap.nationalmap.gov/arcgis/rest/services/USGSImageryOnly/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles courtesy of the <a href="https://usgs.gov/">U.S. Geological Survey</a>'
}).addTo(map);

// Random number helper function
function rand(min, max) {
    return Math.random() * (max - min) + min;
}

// Function that creates the starting window and initializes the guessing game.

// Plot the ten points on the map with cards that pop up and provide a place for user input.

function normalize(s) {
    return (s ?? "").trim().toLowerCase();
};

// Declaring some variables to use later

let features = [];
let markers = [];
let currentIndex = 0;
let score = 0;
let solved = new Set();
let cityState = [];

// function to focus on a specific city -- will be used with our next/previous buttons
function focusCity(i) {
    const n = features.length;
    if (n === 0) return;

    currentIndex = (i + n) % n;

    const coords = features[currentIndex].geometry.coordinates // lng, lat
    const latlng = [coords[1], coords[0]]; // lat, lng which is what Leaflet uses

    map.setView(latlng, map.getZoom());
    map.setZoom(BASE_ZOOM);
    markers[currentIndex]?.openPopup(); // open the markers popup
};


// function for updating the scoreboard
// use this in the shop functions when a user spends points to buy hints
function updateScoreboard () {
    // Update the score display by getting the element and updatingg the inner HTML with the global variable
    document.getElementById("scoreboard").innerHTML = `Your score:${score}`;
    const scoreContainer = document.getElementById("scoreContainer");

    // change the class of the scoreContainer element to effect styling (positive=green, negative=red, 0=black)
    scoreContainer.classList.remove("score-positive", "score-negative", "score-zero");
    if (score > 0) {
        scoreContainer.classList.add("score-positive");
    } else if (score < 0) {
        scoreContainer.classList.add("score-negative");
    } else {
        scoreContainer.classList.add("score-zero");
    }
}

// functions for zoom in and zoom out hints

function useZoomInHint() {
    const index = currentIndex;
    const state = cityState[currentIndex];
    if (state.zoomInUses >= MAX_ZOOM_IN_HINTS) {
        return alert("Maximum number of zoom-ins per city is 5 -- you used all your zoom-ins!")
        
    } else {
        state.zoomInUses+=1;
        score-=ZOOM_IN_COST;
        const newZoom = state.zoomLevel + 1;
        state.zoomLevel= newZoom;
        updateScoreboard();
        map.setZoom(newZoom);
    }

};

function useZoomOutHint() {
    console.log("zoom out hint button pressed")
    const index = currentIndex;
    const state=cityState[currentIndex];
    if (state.zoomOutUses >= MAX_ZOOM_OUT_HINTS) {
        return alert("Maximum number of zoom-outs per city is 5 -- you used all your zoom-outs!")
    } else {
        state.zoomOutUses+=1;
        score-=ZOOM_OUT_COST;
        const newZoom = state.zoomLevel - 1;
        state.zoomLevel = newZoom;
        updateScoreboard();
        map.setZoom(newZoom);
    }
};

function returnToBaseZoom() {
    const state = cityState[currentIndex];
    console.log("return to base zoom button pressed");
    state.zoomLevel = BASE_ZOOM;
    map.setZoom(BASE_ZOOM);
};

function  buyFirstLetter() {
    const state = cityState[currentIndex];
    const feature = features[currentIndex];
    // if there is no feature or no state, then just return instead of crashing
    if (!feature || !state) {
        return;
    }

    const currentInput = document.querySelector(".answerInput");
    // if there is no current input, then just return instead of crashing
    if (!currentInput) {
        return;
    }

    const firstLetter = feature.properties?.NAME?.[0] ?? "";
    // get the first letter if there is one, if not, returns "" nothing
    // then check the state to see if the first letter is bought, if true send an alert
    // if unpurchased, change state to true, populate the first letter, then deduct cost
    if (state.firstLetterBought) {
            alert("You already bought the first letter!")
        }
        else {
            state.firstLetterBought = true;
            currentInput.value = firstLetter;
            score -= FIRST_LETTER_COST;
            updateScoreboard();
    }
};

function applyFeatureCollection(fc) {
    features = fc.features;
    markers = [];
    solved = new Set();
    cityState = features.map(() => ({
        zoomInUses: 0,
        zoomOutUses: 0,
        firstLetterBought: false,
        zoomLevel: BASE_ZOOM,
    }));

    // rest score on new game
    score = 0;
    updateScoreboard();

    // remove previous map layer/markers if they are present
    if (cityLayer) {
        map.removeLayer(cityLayer);
    }

    cityLayer = L.geoJSON(fc, {
        onEachFeature: (feature, layer) => {
            markers.push(layer);
                // save the correct city name to correctName
            const correctName = feature.properties?.NAME ?? "";
            
            // give each pop up a unique element id so we can bind events to them
            const id = feature.id ?? feature.properties.OBJECTID ?? Math.random().toString(36).slice(2);
            const inputId = `guess-${id}`;
            const btnId = `btn-${id}`;
            const msgId = `msg-${id}`;

            // controls whether the pop up answer input or solved box will open when the users clicks/moves to a city pin
            const renderPopupHTML = () => {
                const isSolved = solved.has(id);

                return `
                <div style="width:100px">
                <div><strong><Guess the city</strong></div>

                ${isSolved
                    ? `<div style="margin-top:4px; font-weight:700; color:green">CORRECT!</div>`
                    : `<input class="answerInput" id="${inputId}" type="text" placeholder="Type your guess" style="width: 100%; margin: 5px 0;"/>
                       <button id="${btnId}" type="button" style="width: 100%;">Submit</button>
                       <div id="${msgId}" style="margin-top: 5px;"></div>
                      `
                }
                </div>
            `;
            };

            // this is the old popupHTML that controls what the pop up answer input box will look like when the user clicks the city pin -- delete in final version, replaced by renderPopupHTML
            const popupHTML = `
            <div style="width:100px">
            <div><strong>Guess the city</strong></div>
            <input id="${inputId}" type="text" placeholder="Type your guess" style="width: 100%; margin: 5px 0;"/>
            <button id="${btnId}" type="button" style="width: 100%;">Submit</button>
            <div id="${msgId}" style="margin-top: 5px;"></div>
            </div>
            `;

            layer.bindPopup(renderPopupHTML);

            // controls what will happen when the pop up box opens
            // we want to know wich element (which pin) was clicked, and the ID's associated with it
            // then we want to normalize both the guess and correct name, then check if the user's guess for that city is correct
            
            // So, when the pop up opens, take that element (e) and run the following function
            layer.on("popupopen", (e) => {
                const popupElement = e.popup.getElement();
                const input = popupElement.querySelector(`#${inputId}`);
                const btn = popupElement.querySelector(`#${btnId}`);
                const msg = popupElement.querySelector(`#${msgId}`);

                // prevent map clicks and scsrolls from fighting with typing
                L.DomEvent.disableClickPropagation(popupElement);

                // check the guess
                const check = () => {

                    if (solved.has(id)) return; // If solved has this id, then prevent double scoring
                    
                    // normalize the guess and correct name
                    const guess = normalize(input.value);
                    const answer = normalize(correctName);

                    if(!guess) return;

                    if(guess===answer) {
                        solved.add(id); // mark this id as solved first to prevent double scoring
                        msg.textContent = "CORRECT!";
                        msg.style.color="green"
                        score+=POINTS_PER_CORRECT;

                        // Check if ALL cities are solved
                        if (solved.size == features.length) {
                            if (window.confetti) {
                                confetti({
                                    particleCount: 200,
                                    spread: 70,
                                    origin: {y:0.6}
                                });
                            }

                            setTimeout(() => {
                                alert("You guessed all the cities!");
                            }, 150);
                        }
                        
                        // Update the score display
                        updateScoreboard();

                         // lock down the UI so players cannot spame correct submission and double score
                         input.disabled = true;
                         btn.disabled = true;

                         // Move on to the next city
                         focusCity(currentIndex+1);
                    } else {
                        msg.textContent = "Sorry, try again!";
                    }
                };
                
                btn.addEventListener("click", check);
                input.addEventListener("keydown", (ev) => {
                    if (ev.key === "Enter") check();
                });

                input.focus();
            });
        }
    }).addTo(map);
    currentIndex = 0;
    focusCity(0);
};

loadFirstTen().then(firstTenFC => {
    applyFeatureCollection(firstTenFC);

    // Buttons to go back and forth between cities.
    document.getElementById("nextButton").addEventListener("click", () => {
        focusCity(currentIndex + 1);
    });
    document.getElementById("prevButton").addEventListener("click", () => {
        focusCity(currentIndex-1);
    });

    // Button for new game, uses random 10 from full data set
    document.getElementById("newGameButton").addEventListener("click", () => {
        // Reloads page and script runs again with 10 new cities...
        loadNewTen().then(randomFC => {
            if (!randomFC) return;
            applyFeatureCollection(randomFC);
        });
    });
});

    // Buttons to purchase zoom in / zoom out and first letter

    document.getElementById("storeZoomOut").addEventListener("click", () => {
        useZoomOutHint();
    });

    document.getElementById("storeZoomIn").addEventListener("click", () => {
        useZoomInHint();
    });

    document.getElementById("returnStartZoom").addEventListener("click", () => {
        const state = cityState[currentIndex];
        state.zoomInUses = 0,
        state.zoomOutUses = 0
        returnToBaseZoom();
    });

    document.getElementById("firstLetter").addEventListener("click", () => {
        buyFirstLetter();
});