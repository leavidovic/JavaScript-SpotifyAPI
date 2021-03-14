const APIController = (function() {
    // Für die Registrierung benötigte Kunden-ID und ein Kundengeheimnis, welche hier deklariert werden
    const clientId = 'ADD YOUR CLIENT ID';
    const clientSecret = 'ADD YOUR CLIENT SECRET';

    // Von Spotify erhaltener Inhaber-Token, den man weiterhin verwenden, wenn man verschiedene API´s aufruft
    const _getToken = async () => {
// Post Anfrage
        const result = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: {
                'Content-Type' : 'application/x-www-form-urlencoded', 
                'Authorization' : 'Basic ' + btoa(clientId + ':' + clientSecret)
            },
            
            body: 'grant_type=client_credentials'
        });// Konvertrierung der Daten in JSON

        const data = await result.json();
        // Speicherung des JSON-Ergebnis, Rückgabe der Token aus den JSON-Daten
        return data.access_token;
    }
    
    const _getGenres = async (token) => {
// Wiedergabeliste für Kategorien
      //Get-Anfrage
        const result = await fetch(`https://api.spotify.com/v1/browse/categories?locale=sv_US`, {
            method: 'GET',
            headers: { 'Authorization' : 'Bearer ' + token}
        });
// Konvertierung in JSON
        const data = await result.json();
        return data.categories.items;
    }

    const _getPlaylistByGenre = async (token, genreId) => {
// Wiedergabeliste für Playlists für die passende Kategorie
//Limit um die Anzahl der Wiedergabelisten zu begrenzen
        const limit = 10;
        //Get-Anfrage
        const result = await fetch(`https://api.spotify.com/v1/browse/categories/${genreId}/playlists?limit=${limit}`, {
            method: 'GET',
            headers: { 'Authorization' : 'Bearer ' + token}
        });
// Konvertierung in JSON
        const data = await result.json();
        return data.playlists.items;
    }

    const _getTracks = async (token, tracksEndPoint) => {
// Wiedergabenliste der verschiedenen Tracks in den Playlists
//Limit um die Anzahl der Wiedergabelisten der verschiedensten Tracks zu begrenzen
        const limit = 10;
//Get-Anfrage
        const result = await fetch(`${tracksEndPoint}?limit=${limit}`, {
            method: 'GET',
            headers: { 'Authorization' : 'Bearer ' + token}
        });
// Konvertierung in JSON
        const data = await result.json();
        return data.items;
    }

    const _getTrack = async (token, trackEndPoint) => {
// Wiedergabe eines Tracks
//Get-Anfrage
        const result = await fetch(`${trackEndPoint}`, {
            method: 'GET',
            headers: { 'Authorization' : 'Bearer ' + token}
        });
// Konvertierung in JSON
        const data = await result.json();
        return data;
    }
//Rückgabe der verschiedenen "Klassen"
    return {
        getToken() {
            return _getToken();
        },
        getGenres(token) {
            return _getGenres(token);
        },
        getPlaylistByGenre(token, genreId) {
            return _getPlaylistByGenre(token, genreId);
        },
        getTracks(token, tracksEndPoint) {
            return _getTracks(token, tracksEndPoint);
        },
        getTrack(token, trackEndPoint) {
            return _getTrack(token, trackEndPoint);
        }
    }
})();

//Benutzeroberfläche
// UI Module
const UIController = (function() {

    //Verweise aus der HTML-Datei
    const DOMElements = {
        selectGenre: '#select_genre',
        selectPlaylist: '#select_playlist',
        buttonSubmit: '#btn_submit',
        divSongDetail: '#song-detail',
        hfToken: '#hidden_token',
        divSonglist: '.song-list'
    }

    //public methods Deklaration
    return {

        //Methodeneingabefeld
        inputField() {
            return {
                genre: document.querySelector(DOMElements.selectGenre),
                playlist: document.querySelector(DOMElements.selectPlaylist),
                tracks: document.querySelector(DOMElements.divSonglist),
                submit: document.querySelector(DOMElements.buttonSubmit),
                songDetail: document.querySelector(DOMElements.divSongDetail)
            }
        },

        // Hinzufügen der Auswahloptionen

        //Methode, die die Genres erzeugt + Selektor
        createGenre(text, value) {
            const html = `<option value="${value}">${text}</option>`;
            document.querySelector(DOMElements.selectGenre).insertAdjacentHTML('beforeend', html);
        }, 
//Methode, die die Plalylists erzeugt 
        createPlaylist(text, value) {
            const html = `<option value="${value}">${text}</option>`;
            document.querySelector(DOMElements.selectPlaylist).insertAdjacentHTML('beforeend', html);
        },

        //Methode, die den Titel erzeugt (weist eine ID zu mit dem Namen des Titel)
        createTrack(id, name) {
            const html = `<a href="#" class="list-group-item list-group-item-action list-group-item-light" id="${id}">${name}</a>`;
            document.querySelector(DOMElements.divSonglist).insertAdjacentHTML('beforeend', html);
        },

        // Methode, die den Titel erzeugt im Detail ( mit Bild, Titel und Sänger)
        createTrackDetail(img, title, artist) {

            const detailDiv = document.querySelector(DOMElements.divSongDetail);
            //Detail div: jedesmal wenn der Benutzer ein Lied auswählt sollen alle Details zu diesem Titel erscheinen
            //mit HTML verbunden
            detailDiv.innerHTML = '';

            const html = 
            `
            <div class="row col-sm-12 px-0">
                <img src="${img}" alt="">        
            </div>
            <div class="row col-sm-12 px-0">
                <label for="Genre" class="form-label col-sm-12">${title}:</label>
            </div>
            <div class="row col-sm-12 px-0">
                <label for="artist" class="form-label col-sm-12">By ${artist}:</label>
            </div> 
            `;

            detailDiv.insertAdjacentHTML('beforeend', html)
        },

        resetTrackDetail() {
            this.inputField().songDetail.innerHTML = '';
        },

        resetTracks() {
            this.inputField().tracks.innerHTML = '';
            this.resetTrackDetail();
        },

        resetPlaylist() {
            this.inputField().playlist.innerHTML = '';
            this.resetTracks();
        },
        
        storeToken(value) {
            document.querySelector(DOMElements.hfToken).value = value;
        },

        getStoredToken() {
            return {
                token: document.querySelector(DOMElements.hfToken).value
            }
        }
    }

})();

const APPController = (function(UICtrl, APICtrl) {

    // eingabefeld 
    const DOMInputs = UICtrl.inputField();

    //Genres bei laden der Seite
    const loadGenres = async () => {
        //getTocken
        const token = await APICtrl.getToken();           
        //storeTocken auf der Seite
        UICtrl.storeToken(token);
        //getGenres
        const genres = await APICtrl.getGenres(token);
        //Genre-Auswahlelement
        genres.forEach(element => UICtrl.createGenre(element.name, element.id));
    }

    // Erstellen eines Listener für Genre
    DOMInputs.genre.addEventListener('change', async () => {
        //Playlistzurücksetzen 
        UICtrl.resetPlaylist();
        //Token, welches auf der Seite gespeichert wird, wird aufgerufen
        const token = UICtrl.getStoredToken().token;        
        // Erstellen des Genre-Auswahlfeld
        const genreSelect = UICtrl.inputField().genre;       
        // Aufruf der Genre-ID, des ausgewählten Genre
        const genreId = genreSelect.options[genreSelect.selectedIndex].value;             
        // Aufruf einer Playlist durch Genre
        const playlist = await APICtrl.getPlaylistByGenre(token, genreId);       
        
        playlist.forEach(p => UICtrl.createPlaylist(p.name, p.tracks.href));
    });
     

    // Drücke den Knopf
    DOMInputs.submit.addEventListener('click', async (e) => {
        
        e.preventDefault();
        // zurücksetzen der Titek
        UICtrl.resetTracks();
        //getToken plus Speicherung 
        const token = UICtrl.getStoredToken().token;        
        // Playlist
        const playlistSelect = UICtrl.inputField().playlist;
        //Abrufen des Titelendpunkts basierend auf der ausgewählten Wiedergabeliste
        const tracksEndPoint = playlistSelect.options[playlistSelect.selectedIndex].value;
        // Liste der Titel
        const tracks = await APICtrl.getTracks(token, tracksEndPoint);
        // Titelliste item
        tracks.forEach(el => UICtrl.createTrack(el.track.href, el.track.name))
        
    });

    // Songauswahl erstellen
    DOMInputs.tracks.addEventListener('click', async (e) => {
        
        e.preventDefault();
        UICtrl.resetTrackDetail();
        // getToken
        const token = UICtrl.getStoredToken().token;
        // Tracken-Endpunkt
        const trackEndpoint = e.target.id;
        
        const track = await APICtrl.getTrack(token, trackEndpoint);
        // Titel-Details anzeigen
        UICtrl.createTrackDetail(track.album.images[2].url, track.name, track.artists[0].name);
    });    

    return {
        init() {
            console.log('App is starting');
            loadGenres();
        }
    }

})(UIController, APIController);

//Methode aufrufen, um die Genres beim Laden der Seite zu laden
APPController.init();




