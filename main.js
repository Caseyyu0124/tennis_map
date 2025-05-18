// Store visited countries
const visitedCountries = new Set();

// Load visited countries from local storage
function loadVisitedCountries() {
    const stored = localStorage.getItem('visitedCountries');
    if (stored) {
        const countries = JSON.parse(stored);
        countries.forEach(country => visitedCountries.add(country));
    }
}

// Save visited countries to local storage
function saveVisitedCountries() {
    localStorage.setItem('visitedCountries', JSON.stringify([...visitedCountries]));
}

// Globe variables
let scene, camera, renderer, labelRenderer, controls, globe;
let countryMeshes = {}; // Store country meshes for quick access
let visibleLabels = []; // Track currently visible labels
let saturn; // Reference to Saturn system

// List of major countries to prioritize
const majorCountries = [
    "United States of America", "Russia", "Canada", "China", "Brazil", 
    "Australia", "India", "Argentina", "Kazakhstan", "Algeria", "Mexico",
    "Indonesia", "Saudi Arabia", "Iran", "Japan", "Egypt", "France", 
    "Thailand", "Spain", "Turkey", "Germany", "Italy", "United Kingdom", 
    "South Africa", "Colombia", "Ukraine", "Pakistan"
];

// Create a Three.js scene
function initScene() {
    // Create scene, camera, renderer
    scene = new THREE.Scene();
    
    // Set up container dimensions
    const container = document.getElementById('globe-container');
    const width = container.offsetWidth;
    const height = container.offsetHeight;
    
    // Create camera
    camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 2000);
    camera.position.z = 200;
    
    // Set up WebGL renderer
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);
    
    // Set up CSS2D renderer for labels
    labelRenderer = new THREE.CSS2DRenderer();
    labelRenderer.setSize(width, height);
    labelRenderer.domElement.style.position = 'absolute';
    labelRenderer.domElement.style.top = '0';
    labelRenderer.domElement.style.pointerEvents = 'none';
    container.appendChild(labelRenderer.domElement);
    
    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 3, 5);
    scene.add(directionalLight);
    
    // Create Saturn in the background
    createSaturn();
    
    // Add orbit controls
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.rotateSpeed = 0.5;
    controls.minDistance = 120;
    controls.maxDistance = 300;
    
    // Create Earth
    createEarth();

    // Create stars background
    createStars();
    
    // Load country data
    loadCountries();
    
    // Handle window resize
    window.addEventListener('resize', onWindowResize);
    
    // Start animation
    animate();
}

// Create Earth globe
function createEarth() {
    // Earth with cloud texture
    const earthGeometry = new THREE.SphereGeometry(100, 64, 64);
    
    const earthMaterial = new THREE.MeshPhongMaterial({
        color: 0x1a428a,       // Base blue color
        shininess: 10,
        transparent: true,
        opacity: 0.9
    });
    
    // Create Earth mesh
    globe = new THREE.Mesh(earthGeometry, earthMaterial);
    scene.add(globe);
    
    // Add a subtle glow effect
    const glowMaterial = new THREE.ShaderMaterial({
        uniforms: {
            c: { value: 0.2 },
            p: { value: 1.4 },
            glowColor: { value: new THREE.Color(0x00b3ff) },
            viewVector: { value: camera.position }
        },
        vertexShader: `
            uniform vec3 viewVector;
            varying float intensity;
            void main() {
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                vec3 actual_normal = normal;
                intensity = pow(dot(normalize(viewVector), actual_normal), 1.4);
            }
        `,
        fragmentShader: `
            uniform vec3 glowColor;
            varying float intensity;
            void main() {
                gl_FragColor = vec4(glowColor, 0.25 * intensity);
            }
        `,
        side: THREE.BackSide,
        blending: THREE.AdditiveBlending,
        transparent: true
    });

    const glowMesh = new THREE.Mesh(new THREE.SphereGeometry(105, 64, 64), glowMaterial);
    scene.add(glowMesh);
}

// Create stars background
function createStars() {
    const starGeometry = new THREE.BufferGeometry();
    const starMaterial = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.7,
        transparent: true
    });

    const starVertices = [];
    for (let i = 0; i < 10000; i++) {
        const x = (Math.random() - 0.5) * 2000;
        const y = (Math.random() - 0.5) * 2000;
        const z = (Math.random() - 0.5) * 2000;
        starVertices.push(x, y, z);
    }

    starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);
}

// Load and display country boundaries
function loadCountries() {
    // First load saved visited countries
    loadVisitedCountries();
    
    fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json')
        .then(response => response.json())
        .then(data => {
            const countries = data.objects.countries;
            const countryFeatures = topojson.feature(data, countries).features;
            
            countryFeatures.forEach(country => {
                const countryMesh = createCountryMesh(country);
                if (countryMesh) {
                    globe.add(countryMesh);
                    countryMeshes[country.properties.name] = countryMesh;
                    
                    // Apply visited status from saved data
                    const countryName = country.properties.name;
                    if (visitedCountries.has(countryName)) {
                        countryMesh.material.color.set(0xff9900);
                        countryMesh.material.opacity = 0.8;
                    }
                }
            });
            
            // Update info text with count of visited countries
            document.getElementById('country-info').textContent = 
                `You've visited ${visitedCountries.size} countries. Click on a country to mark it as visited.`;
            
            // Update counter
            updateVisitedCounter();
            
            // Update visited countries list
            updateVisitedCountriesList();
            
            // Add country labels
            addCountryLabels();
            
            addClickInteraction();
        });
}

// Create mesh for a country
function createCountryMesh(country) {
    if (!country.geometry) return null;
    
    const material = new THREE.MeshPhongMaterial({
        color: 0x3a7a50,
        transparent: true,
        opacity: 0.3,
        side: THREE.DoubleSide
    });
    
    // Create buffer geometry for country
    const vertices = [];
    const faces = [];
    
    // Process country geometry based on type
    if (country.geometry.type === 'Polygon') {
        processPolygon(country.geometry.coordinates[0], vertices, faces);
    } else if (country.geometry.type === 'MultiPolygon') {
        country.geometry.coordinates.forEach(polygon => {
            processPolygon(polygon[0], vertices, faces);
        });
    }
    
    if (vertices.length === 0) return null;
    
    // Create geometry from vertices and faces
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setIndex(faces);
    geometry.computeVertexNormals();
    
    // Calculate centroid for label placement
    let centroidX = 0, centroidY = 0, centroidZ = 0;
    const positionArray = geometry.attributes.position.array;
    const vertexCount = positionArray.length / 3;
    
    for (let i = 0; i < positionArray.length; i += 3) {
        centroidX += positionArray[i];
        centroidY += positionArray[i + 1];
        centroidZ += positionArray[i + 2];
    }
    
    centroidX /= vertexCount;
    centroidY /= vertexCount;
    centroidZ /= vertexCount;
    
    const mesh = new THREE.Mesh(geometry, material);
    mesh.userData = { 
        country: country.properties.name,
        centroid: new THREE.Vector3(centroidX, centroidY, centroidZ)
    };
    
    return mesh;
}

// Process polygon coordinates to create 3D geometry on the sphere
function processPolygon(coordinates, vertices, faces) {
    if (!coordinates || coordinates.length < 3) return;
    
    const baseIndex = vertices.length / 3;
    const localVertices = [];
    
    // Create vertices
    coordinates.forEach(coord => {
        const point = latLongToVector3(coord[1], coord[0], 101);
        vertices.push(point.x, point.y, point.z);
        localVertices.push([point.x, point.y, point.z]);
    });
    
    // Create triangulation for the polygon
    for (let i = 1; i < localVertices.length - 1; i++) {
        faces.push(baseIndex, baseIndex + i, baseIndex + i + 1);
    }
}

// Convert latitude and longitude to 3D position
function latLongToVector3(lat, lon, radius) {
    const phi = (90 - lat) * Math.PI / 180;
    const theta = (lon + 180) * Math.PI / 180;
    
    const x = -(radius * Math.sin(phi) * Math.cos(theta));
    const z = (radius * Math.sin(phi) * Math.sin(theta));
    const y = (radius * Math.cos(phi));
    
    return new THREE.Vector3(x, y, z);
}

// Add click event to countries
function addClickInteraction() {
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let isDragging = false;
    let mouseDownTime = 0;
    
    // Add mousedown/mouseup detection to prevent accidental clicks during dragging
    document.getElementById('globe-container').addEventListener('mousedown', () => {
        isDragging = false;
        mouseDownTime = Date.now();
    });
    
    // Only set dragging if mouse moves while button is pressed
    controls.addEventListener('change', () => {
        if (mouseDownTime > 0) {
            isDragging = true;
        }
    });
    
    document.getElementById('globe-container').addEventListener('click', (event) => {
        // If we were dragging a significant amount, don't count this as a click
        // Also check if the click happens within a short time of mousedown (not a drag)
        const clickTime = Date.now();
        const isQuickClick = clickTime - mouseDownTime < 300; // 300ms threshold
        
        if (isDragging && !isQuickClick) return;
        
        // Calculate mouse position in normalized device coordinates
        const rect = renderer.domElement.getBoundingClientRect();
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        
        // Cast ray from mouse position
        raycaster.setFromCamera(mouse, camera);
        
        // Check for intersections with country meshes
        const intersects = raycaster.intersectObjects(globe.children);
        
        if (intersects.length > 0) {
            const selectedObject = intersects[0].object;
            if (selectedObject.userData && selectedObject.userData.country) {
                const countryName = selectedObject.userData.country;
                toggleVisitedCountry(countryName, selectedObject);
            }
        }
        
        // Reset flags
        isDragging = false;
        mouseDownTime = 0;
    });
}

// Toggle country visited status
function toggleVisitedCountry(countryName, countryMesh) {
    if (visitedCountries.has(countryName)) {
        // Unmark as visited
        visitedCountries.delete(countryName);
        countryMesh.material.color.set(0x3a7a50);
        countryMesh.material.opacity = 0.3;
        document.getElementById('country-info').textContent = `${countryName} marked as not visited`;
        
        // Update label style
        if (countryMesh.userData.label && countryMesh.userData.label.element) {
            countryMesh.userData.label.element.style.color = 'white';
            countryMesh.userData.label.element.style.fontWeight = 'normal';
            
            // Update priority status based on whether it's a major country
            countryMesh.userData.isLabelMajor = majorCountries.includes(countryName);
            
            // Update label class
            if (countryMesh.userData.isLabelMajor) {
                countryMesh.userData.label.element.className = 'country-label major';
            } else {
                countryMesh.userData.label.element.className = 'country-label minor';
            }
        }
    } else {
        // Mark as visited
        visitedCountries.add(countryName);
        countryMesh.material.color.set(0xff9900);
        countryMesh.material.opacity = 0.8;
        document.getElementById('country-info').textContent = `${countryName} visited!`;
        
        // Update label style
        if (countryMesh.userData.label && countryMesh.userData.label.element) {
            countryMesh.userData.label.element.style.color = '#ff9900';
            countryMesh.userData.label.element.style.fontWeight = 'bold';
            
            // Make visited countries have high priority labels
            countryMesh.userData.isLabelMajor = true;
            countryMesh.userData.label.element.className = 'country-label major';
        }
    }
    
    // Save changes to local storage
    saveVisitedCountries();
    
    // Update counter
    updateVisitedCounter();
    
    // Update visited countries list
    updateVisitedCountriesList();
}

// Handle window resize
function onWindowResize() {
    const container = document.getElementById('globe-container');
    const width = container.offsetWidth;
    const height = container.offsetHeight;
    
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    
    renderer.setSize(width, height);
    labelRenderer.setSize(width, height);
}

// Update label visibility to prevent overlapping
function updateLabelVisibility() {
    if (!globe) return;
    
    // Reset visible labels array
    visibleLabels = [];
    
    // Get all potential labels that should be visible
    const potentialVisibleLabels = [];
    
    // Get globe center and radius in world space
    const globeWorldPos = new THREE.Vector3();
    globe.getWorldPosition(globeWorldPos);
    const globeRadius = 100; // Our globe radius
    
    // Process each country mesh
    Object.entries(countryMeshes).forEach(([countryName, mesh]) => {
        if (!mesh || !mesh.userData.label) return;
        
        const label = mesh.userData.label;
        const labelElement = label.element;
        
        // Get label position in world coordinates
        const worldPos = new THREE.Vector3();
        label.getWorldPosition(worldPos);
        
        // Vector from globe center to label position
        const globeToLabel = worldPos.clone().sub(globeWorldPos).normalize();
        
        // Vector from globe center to camera
        const globeToCamera = camera.position.clone().sub(globeWorldPos).normalize();
        
        // Dot product determines if point is on visible hemisphere
        // > 0 means the angle is less than 90 degrees (visible side)
        const visibleHemisphere = globeToLabel.dot(globeToCamera) > 0;
        
        if (visibleHemisphere) {
            // Get screen position of the label
            const screenPos = worldPos.clone().project(camera);
            
            // Check if in view bounds with margin
            if (screenPos.x > -0.9 && screenPos.x < 0.9 && 
                screenPos.y > -0.9 && screenPos.y < 0.9) {
                    
                // Convert to screen coordinates
                const screenX = (screenPos.x + 1) * labelRenderer.domElement.clientWidth / 2;
                const screenY = (-screenPos.y + 1) * labelRenderer.domElement.clientHeight / 2;
                
                // Calculate distance from camera (for depth sorting)
                const distanceToCamera = worldPos.distanceTo(camera.position);
                
                // Priority score (higher = more likely to be shown)
                let priority = 0;
                
                // Higher priority for visited countries
                if (visitedCountries.has(countryName)) {
                    priority += 1000;
                }
                
                // Higher priority for major countries
                if (mesh.userData.isLabelMajor) {
                    priority += 500;
                }
                
                // Lower priority for labels farther from camera center (prefer central items)
                const distFromCenter = Math.sqrt(screenPos.x * screenPos.x + screenPos.y * screenPos.y);
                priority -= distFromCenter * 100;
                
                potentialVisibleLabels.push({
                    countryName,
                    label,
                    element: labelElement,
                    screenX,
                    screenY,
                    depth: distanceToCamera,
                    priority
                });
            }
        } else {
            // Ensure labels on back side are hidden
            labelElement.style.opacity = '0';
        }
    });
    
    // Sort by priority first, then by depth (closer to camera first)
    potentialVisibleLabels.sort((a, b) => {
        // First compare by priority
        const priorityDiff = b.priority - a.priority;
        if (Math.abs(priorityDiff) > 100) {
            return priorityDiff;
        }
        // If priorities are similar, show closer ones first
        return a.depth - b.depth;
    });
    
    // Check for overlaps and determine which labels to show
    const labelBoxes = [];
    
    // Limit maximum number of labels to avoid cluttering
    const maxLabels = Math.min(15, potentialVisibleLabels.length);
    let labelCount = 0;
    
    // Process labels in priority/depth order
    potentialVisibleLabels.forEach(labelInfo => {
        // Don't process more labels if we've reached the maximum
        if (labelCount >= maxLabels) {
            labelInfo.element.style.opacity = '0';
            return;
        }
        
        // Get element dimensions
        const width = labelInfo.element.offsetWidth || 100; // Fallback if not yet measured
        const height = labelInfo.element.offsetHeight || 20;
        
        // Define label box with margin (larger margin for bigger separation)
        const margin = 15;
        const box = {
            left: labelInfo.screenX - (width / 2) - margin,
            right: labelInfo.screenX + (width / 2) + margin,
            top: labelInfo.screenY - (height / 2) - margin,
            bottom: labelInfo.screenY + (height / 2) + margin
        };
        
        // Check if this box overlaps with any existing visible label
        let hasOverlap = labelBoxes.some(existingBox => {
            return !(
                box.right < existingBox.left || 
                box.left > existingBox.right || 
                box.bottom < existingBox.top || 
                box.top > existingBox.bottom
            );
        });
        
        // If no overlap, show this label
        if (!hasOverlap) {
            // Add to visible labels
            visibleLabels.push(labelInfo.countryName);
            labelBoxes.push(box);
            labelCount++;
            
            // Make label visible and set z-index based on depth
            // Closer labels get higher z-index
            const zIndex = 1000 - Math.round(labelInfo.depth);
            labelInfo.element.style.opacity = '1';
            labelInfo.element.style.zIndex = zIndex;
        } else {
            // Hide overlapping label
            labelInfo.element.style.opacity = '0';
        }
    });
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    updateLabelVisibility();
    
    // Animate Saturn's rotation
    if (saturn) {
        // Rotate Saturn slowly for subtle background animation
        saturn.rotation.y += 0.0005;
        // Oscillate slightly for a more dynamic look
        saturn.position.y = 350 + Math.sin(Date.now() * 0.0001) * 20;
    }
    
    renderer.render(scene, camera);
    labelRenderer.render(scene, camera);
}

// Reset all visited countries
function resetVisitedCountries() {
    // Clear the set
    visitedCountries.clear();
    
    // Reset all country meshes to default style
    Object.values(countryMeshes).forEach(mesh => {
        mesh.material.color.set(0x3a7a50);
        mesh.material.opacity = 0.3;
        
        // Reset label style
        if (mesh.userData.label && mesh.userData.label.element) {
            mesh.userData.label.element.style.color = 'white';
            mesh.userData.label.element.style.fontWeight = 'normal';
            
            // Update priority of label
            const countryName = mesh.userData.country;
            mesh.userData.isLabelMajor = majorCountries.includes(countryName);
        }
    });
    
    // Update counter
    updateVisitedCounter();
    
    // Clear local storage
    localStorage.removeItem('visitedCountries');
    
    // Update info text
    document.getElementById('country-info').textContent = 'All countries have been reset to not visited';
    
    // Update visited countries list
    updateVisitedCountriesList();
}

// Update the counter displaying number of visited countries
function updateVisitedCounter() {
    document.getElementById('visited-count').textContent = visitedCountries.size;
}

// Update the list of visited countries
function updateVisitedCountriesList() {
    const listElement = document.getElementById('visited-list');
    listElement.innerHTML = '';
    
    // Sort countries alphabetically
    const sortedCountries = Array.from(visitedCountries).sort();
    
    if (sortedCountries.length === 0) {
        listElement.innerHTML = '<em>No countries visited yet</em>';
    } else {
        sortedCountries.forEach(country => {
            const tag = document.createElement('span');
            tag.className = 'country-tag';
            tag.textContent = country;
            listElement.appendChild(tag);
        });
    }
}

// Add country name labels
function addCountryLabels() {
    console.log("Adding country labels...");
    
    // Calculate country sizes from geometry to determine importance
    const countrySizes = {};
    let totalArea = 0;
    
    // Calculate approximate size of each country's geometry
    Object.entries(countryMeshes).forEach(([countryName, mesh]) => {
        if (!mesh || !mesh.geometry) return;
        
        // Estimate area using geometry's bounding box
        mesh.geometry.computeBoundingBox();
        const box = mesh.geometry.boundingBox;
        const size = new THREE.Vector3();
        box.getSize(size);
        
        // Calculate approximate area
        const area = size.x * size.y * size.z;
        countrySizes[countryName] = area;
        totalArea += area;
    });
    
    // Sort countries by size (largest first)
    const sortedCountries = Object.keys(countryMeshes).sort((a, b) => {
        return (countrySizes[b] || 0) - (countrySizes[a] || 0);
    });
    
    // Create label for each country with priority
    sortedCountries.forEach((countryName) => {
        const mesh = countryMeshes[countryName];
        if (!mesh || !mesh.userData.centroid) return;
        
        // Determine if this is a major country
        const isMajor = majorCountries.includes(countryName) || 
                        countrySizes[countryName] > (totalArea / 200) ||
                        visitedCountries.has(countryName);
        
        // Create HTML element for label
        const labelDiv = document.createElement('div');
        labelDiv.className = isMajor ? 'country-label major' : 'country-label minor';
        labelDiv.textContent = countryName;
        
        // Create CSS2D object for the label
        const label = new THREE.CSS2DObject(labelDiv);
        
        // Position at the centroid of the country's geometry
        label.position.copy(mesh.userData.centroid.clone().normalize().multiplyScalar(102));
        
        // Only show major country labels by default
        labelDiv.style.opacity = isMajor ? "1" : "0";
        
        // Add label to the scene
        globe.add(label);
        
        // Store reference to the label
        mesh.userData.label = label;
        mesh.userData.isLabelMajor = isMajor;
        
        // Update label style if country is visited
        if (visitedCountries.has(countryName)) {
            labelDiv.style.color = '#ff9900';
            labelDiv.style.fontWeight = 'bold';
        }
    });
    
    console.log(`Added labels: ${sortedCountries.length} total, with priority for major countries`);
}

// Create Saturn with rings in the background
function createSaturn() {
    // Saturn itself (the planet body)
    const saturnGeometry = new THREE.SphereGeometry(40, 32, 32);
    const saturnMaterial = new THREE.MeshPhongMaterial({
        color: 0xf0e0a0,  // Yellowish color for Saturn
        shininess: 5,
        emissive: 0x222200
    });
    
    // Add some subtle bands to Saturn's texture
    const bands = [];
    for (let i = 0; i < 8; i++) {
        const y = -0.8 + i * 0.2;
        const shade = 0.8 + Math.random() * 0.4; // Random shade for band
        bands.push({
            y: y,
            thickness: 0.1 + Math.random() * 0.05,
            color: new THREE.Color(shade, shade * 0.95, shade * 0.8)
        });
    }
    
    // Apply bands to Saturn material
    saturnMaterial.onBeforeCompile = (shader) => {
        shader.uniforms.bands = { value: bands };
        shader.vertexShader = `
            varying vec3 vPos;
            ${shader.vertexShader.replace(
                'void main() {',
                'void main() { vPos = position;'
            )}
        `;
        shader.fragmentShader = `
            struct Band {
                float y;
                float thickness;
                vec3 color;
            };
            uniform Band bands[8];
            varying vec3 vPos;
            ${shader.fragmentShader.replace(
                'vec4 diffuseColor = vec4( diffuse, opacity );',
                `vec4 diffuseColor = vec4( diffuse, opacity );
                float y = normalize(vPos).y;
                for (int i = 0; i < 8; i++) {
                    float dist = abs(y - bands[i].y);
                    if (dist < bands[i].thickness) {
                        float blend = 1.0 - dist / bands[i].thickness;
                        diffuseColor.rgb = mix(diffuseColor.rgb, bands[i].color, blend * 0.6);
                    }
                }`
            )}
        `;
    };
    
    const saturnPlanet = new THREE.Mesh(saturnGeometry, saturnMaterial);
    
    // Create Saturn's rings
    const ringGeometry = new THREE.RingGeometry(50, 80, 64);
    const ringMaterial = new THREE.MeshPhongMaterial({
        color: 0xe0c080,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.7,
        shininess: 25
    });
    
    // Add ring texture pattern
    ringMaterial.onBeforeCompile = (shader) => {
        shader.uniforms.ringPatterns = { value: 5.0 };
        shader.vertexShader = `
            varying vec2 vUv;
            ${shader.vertexShader.replace(
                'void main() {',
                'void main() { vUv = uv;'
            )}
        `;
        shader.fragmentShader = `
            uniform float ringPatterns;
            varying vec2 vUv;
            ${shader.fragmentShader.replace(
                'vec4 diffuseColor = vec4( diffuse, opacity );',
                `vec4 diffuseColor = vec4( diffuse, opacity );
                float dist = distance(vec2(0.5), vUv.xy) * 2.0;
                float ring = sin(dist * ringPatterns * 3.14159) * 0.5 + 0.5;
                diffuseColor.a *= mix(0.6, 1.0, ring);
                diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * 1.4, ring * 0.4);`
            )}
        `;
    };
    
    const rings = new THREE.Mesh(ringGeometry, ringMaterial);
    rings.rotation.x = Math.PI / 4; // Tilt the rings
    
    // Create a container for Saturn and its rings
    const saturnSystem = new THREE.Group();
    saturnSystem.add(saturnPlanet);
    saturnSystem.add(rings);
    
    // Position Saturn in the distant background
    saturnSystem.position.set(800, 350, -1200);
    saturnSystem.rotation.z = Math.PI / 10; // Slight tilt
    saturnSystem.scale.set(1.5, 1.5, 1.5); // Make it a bit bigger
    
    // Add Saturn to the scene
    scene.add(saturnSystem);
    
    // Store reference to Saturn
    saturn = saturnSystem;
    
    return saturnSystem;
}

// Initialize the scene when DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    initScene();
    
    // Add event listener for reset button
    document.getElementById('reset-button').addEventListener('click', resetVisitedCountries);
}); 