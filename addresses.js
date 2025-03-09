document.addEventListener('DOMContentLoaded', function() {
    const modal = document.getElementById('address-modal');
    const addAddressBtn = document.getElementById('add-address-btn');
    const closeBtn = document.querySelector('.close-btn');
    const addressForm = document.getElementById('address-form');
    const useCurrentLocationBtn = document.getElementById('use-current-location');
    let map, marker;
    let currentPosition = null;

    // Initialize Google Maps
    function initMap() {
        // Default center (you can set this to your city's coordinates)
        const defaultCenter = { lat: 20.5937, lng: 78.9629 };
        
        map = new google.maps.Map(document.getElementById('map'), {
            zoom: 15,
            center: defaultCenter,
        });

        // Initialize the autocomplete search
        const input = document.getElementById('location-search');
        const autocomplete = new google.maps.places.Autocomplete(input);
        
        autocomplete.addListener('place_changed', () => {
            const place = autocomplete.getPlace();
            if (place.geometry) {
                map.setCenter(place.geometry.location);
                if (marker) marker.setMap(null);
                marker = new google.maps.Marker({
                    map: map,
                    position: place.geometry.location
                });

                // Fill in address details
                fillAddressDetails(place);
            }
        });

        // Add click listener to map
        map.addListener('click', (e) => {
            placeMarker(e.latLng);
            getAddressFromLatLng(e.latLng);
        });
    }

    // Get current location
    useCurrentLocationBtn.addEventListener('click', () => {
        if (navigator.geolocation) {
            useCurrentLocationBtn.disabled = true;
            useCurrentLocationBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Detecting...';
            
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    currentPosition = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    };
                    
                    getAddressFromLatLng(currentPosition);
                    useCurrentLocationBtn.disabled = false;
                    useCurrentLocationBtn.innerHTML = '<i class="fas fa-crosshairs"></i> Use Current Location';
                },
                (error) => {
                    alert('Error getting location: ' + error.message);
                    useCurrentLocationBtn.disabled = false;
                    useCurrentLocationBtn.innerHTML = '<i class="fas fa-crosshairs"></i> Use Current Location';
                }
            );
        } else {
            alert('Geolocation is not supported by this browser.');
        }
    });

    // Place marker on map
    function placeMarker(latLng) {
        if (marker) marker.setMap(null);
        marker = new google.maps.Marker({
            position: latLng,
            map: map
        });
        map.panTo(latLng);
    }

    // Get address from coordinates
    function getAddressFromLatLng(latLng) {
        const geocoder = new google.maps.Geocoder();
        geocoder.geocode({ location: latLng }, (results, status) => {
            if (status === 'OK') {
                if (results[0]) {
                    fillAddressDetails(results[0]);
                }
            } else {
                alert('Geocoder failed due to: ' + status);
            }
        });
    }

    // Fill address details in form
    function fillAddressDetails(place) {
        let address = '';
        let city = '';
        let pincode = '';

        place.address_components.forEach(component => {
            const type = component.types[0];
            if (type === 'street_address' || type === 'route') {
                address += component.long_name + ' ';
            } else if (type === 'locality') {
                city = component.long_name;
            } else if (type === 'postal_code') {
                pincode = component.long_name;
            }
        });

        document.getElementById('complete-address').value = address;
        document.getElementById('city').value = city;
        document.getElementById('pincode').value = pincode;
    }

    // Load saved addresses
    function loadSavedAddresses() {
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        if (!currentUser) return;

        const addresses = JSON.parse(localStorage.getItem(`addresses_${currentUser.email}`)) || [];
        const addressesGrid = document.getElementById('addresses-grid');

        if (addresses.length === 0) {
            addressesGrid.innerHTML = `
                <div class="no-addresses">
                    <p>No saved addresses yet. Add your first address!</p>
                </div>
            `;
            return;
        }

        addressesGrid.innerHTML = addresses.map((address, index) => `
            <div class="address-card">
                <span class="type-badge">${address.type}</span>
                <h3>${address.type}</h3>
                <p>${address.completeAddress}</p>
                <p>${address.city}, ${address.pincode}</p>
                <div class="address-actions">
                    <button class="edit" onclick="editAddress(${index})">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button onclick="deleteAddress(${index})">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        `).join('');
    }

    // Save address
    addressForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        if (!currentUser) {
            alert('Please login to save addresses');
            return;
        }

        const addressData = {
            type: document.querySelector('.type-btn.active').dataset.type,
            completeAddress: document.getElementById('complete-address').value,
            city: document.getElementById('city').value,
            pincode: document.getElementById('pincode').value,
            coordinates: marker ? {
                lat: marker.getPosition().lat(),
                lng: marker.getPosition().lng()
            } : null
        };

        const addresses = JSON.parse(localStorage.getItem(`addresses_${currentUser.email}`)) || [];
        addresses.push(addressData);
        localStorage.setItem(`addresses_${currentUser.email}`, JSON.stringify(addresses));

        modal.style.display = 'none';
        loadSavedAddresses();
        addressForm.reset();
    });

    // Modal controls
    addAddressBtn.onclick = () => modal.style.display = 'block';
    closeBtn.onclick = () => modal.style.display = 'none';
    window.onclick = (e) => {
        if (e.target === modal) modal.style.display = 'none';
    }

    // Address type selection
    document.querySelectorAll('.type-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.type-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });

    // Initialize map and load saved addresses
    initMap();
    loadSavedAddresses();
});

// Edit address function
function editAddress(index) {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const addresses = JSON.parse(localStorage.getItem(`addresses_${currentUser.email}`)) || [];
    const address = addresses[index];

    // Fill form with address data
    document.querySelectorAll('.type-btn').forEach(btn => {
        if (btn.dataset.type === address.type) btn.classList.add('active');
        else btn.classList.remove('active');
    });

    document.getElementById('complete-address').value = address.completeAddress;
    document.getElementById('city').value = address.city;
    document.getElementById('pincode').value = address.pincode;

    if (address.coordinates) {
        map.setCenter(address.coordinates);
        placeMarker(address.coordinates);
    }

    // Show modal
    document.getElementById('address-modal').style.display = 'block';

    // Remove old address and save new one on form submit
    addresses.splice(index, 1);
    localStorage.setItem(`addresses_${currentUser.email}`, JSON.stringify(addresses));
}

// Delete address function
function deleteAddress(index) {
    if (confirm('Are you sure you want to delete this address?')) {
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        const addresses = JSON.parse(localStorage.getItem(`addresses_${currentUser.email}`)) || [];
        addresses.splice(index, 1);
        localStorage.setItem(`addresses_${currentUser.email}`, JSON.stringify(addresses));
        loadSavedAddresses();
    }
} 