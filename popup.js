document.addEventListener('DOMContentLoaded', () => {

  const tabContentAdd = document.getElementById('tab-content-add');
  const tabContentHistory = document.getElementById('tab-content-history');
  const progressList = document.getElementById('progress');
  const clearButton = document.getElementById('clear');
  const addButton = document.getElementById('add-playlist');
  const playlistLinkInput = document.getElementById('playlist-link');
  const playlistNameInput = document.getElementById('playlist-name');
  const playlistContainer = document.getElementById('playlist-container');

  chrome.runtime.sendMessage({ type: 'getProgress' }, (response) => {
    if (response.length != 0) {
      tabContentAdd.style.display = "none";
      tabContentHistory.style.display = "flex";
    }
  });

  const buttons = document.getElementsByClassName('redirectButton');
  for (let button of buttons) {
    button.addEventListener('click', function () {
      const url = this.getAttribute('data-url');
      chrome.tabs.create({ url: url });
    });
  }

  function displayProgress() {
    // playlistContainer.style.display = "none";
    chrome.runtime.sendMessage({ type: 'getProgress' }, (response) => {
      const progress = response || [];
      progress.forEach(item => {
        const imgThumbnail = document.getElementById("thumbnail-img");
        const playListName = document.getElementById("playlist-title");
        const playListUrl = document.getElementById("playlist-url");

        playListUrl.href = `https://www.youtube.com/watch?v=${item.videoId}&list=${item.playlistId}`;
        playListName.textContent = item.name;

        imgThumbnail.src = `https://img.youtube.com/vi/${item.videoId}/0.jpg`;

        // imgThumbnail.src = `https://img.youtube.com/vi/${item.videoId}/mqdefault.jpg`;
        // imgThumbnail.src = `https://img.youtube.com/vi/HJncmkjxOEs/maxresdefault.jpg`;
      });
    });
  }

  async function getFirstVideo(playlistId, name) {
    try {
      const response = await fetch(`https://www.youtube.com/playlist?list=${playlistId}`);
      const text = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(text, 'text/html');
      let htmlContent = doc.documentElement.innerHTML;

      let urlPattern = /"url":\s*"(\/watch\?v=([^&]+))/;
      let match = htmlContent.match(urlPattern);

      if (match) {
        let fullUrl = match[1].split('\\u0026').join('&');
        let videoId = fullUrl.split('=')[1].split('&')[0];

        console.log('Video ID:', videoId);

        chrome.runtime.sendMessage({ type: 'setProgress', data: [{ videoId, playlistId, name }] }, (response) => {
          console.log('Progress updated:', response.success);
        });

        chrome.tabs.create({ url: `https://www.youtube.com/watch?v=${videoId}&list=${playlistId}` });
      } else {
        console.log('Video ID tidak ditemukan');
      }
    } catch (error) {
      console.error('Error fetching playlist:', error);
      throw new Error('Failed to fetch playlist data');
    }
  }


  addButton.addEventListener('click', () => {
    const playlistLink = playlistLinkInput.value;
    const playlistName = playlistNameInput.value;
    const urlParams = new URLSearchParams(playlistLink.split('?')[1]);
    const playlistId = urlParams.get('list');

    if (playlistId) {
      chrome.runtime.sendMessage({ type: 'addPlaylist', data: { playlistId, name: playlistName } }, async (response) => {
        if (response.success) {
          playlistLinkInput.value = '';
          playlistNameInput.value = '';
          displayProgress();
          getFirstVideo(playlistId, playlistName)
        }
      });
    } else {
      if (playlistName.length == 0) {
        document.getElementById('invalid-name').style.display = "block";
        document.getElementById('invalid-link').style.display = "none";
      } else if (playlistLink.length == 0) {
        document.getElementById('invalid-link').style.display = "block";
        document.getElementById('invalid-name').style.display = "none";
      } else {
        document.getElementById('invalid-name').style.display = "none";
        document.getElementById('invalid-link').style.display = "block";
      }
    }
  });

  clearButton.addEventListener('click', () => {
    chrome.runtime.sendMessage({ type: 'setProgress', data: [] }, (response) => {
      if (response.success) {
        // playlistContainer.style.display = "none";
      }
    });
    tabContentAdd.style.display = "flex";
    tabContentHistory.style.display = "none";
  });

  displayProgress();
});
