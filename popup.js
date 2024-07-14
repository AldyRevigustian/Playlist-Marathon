document.addEventListener('DOMContentLoaded', () => {

  const tabAdd = document.getElementById('tab-add');
  const tabHistory = document.getElementById('tab-history');
  const tabContentAdd = document.getElementById('tab-content-add');
  const tabContentHistory = document.getElementById('tab-content-history');
  const progressList = document.getElementById('progress');
  const clearButton = document.getElementById('clear');
  const addButton = document.getElementById('add-playlist');
  const playlistLinkInput = document.getElementById('playlist-link');
  const playlistNameInput = document.getElementById('playlist-name');

  chrome.runtime.sendMessage({ type: 'getProgress' }, (response) => {
    if (response.length != 0) {
      tabContentAdd.classList.remove('tab-active');
      tabContentHistory.classList.add('tab-active');
    }
  });

  function displayProgress() {
    progressList.innerHTML = '';
    chrome.runtime.sendMessage({ type: 'getProgress' }, (response) => {
      const progress = response || [];
      progress.forEach(item => {
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = `https://www.youtube.com/watch?v=${item.videoId}&list=${item.playlistId}`;
        a.textContent = item.name;
        a.target = '_blank';
        const img = document.createElement('img');
        img.src = `https://img.youtube.com/vi/${item.videoId}/0.jpg`;
        li.appendChild(img);
        li.appendChild(a);
        progressList.appendChild(li);
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
      alert('Invalid playlist link or ID');
    }
  });

  clearButton.addEventListener('click', () => {
    chrome.runtime.sendMessage({ type: 'setProgress', data: [] }, (response) => {
      if (response.success) {
        progressList.innerHTML = '';
      }
    });
    
    tabContentAdd.classList.add('tab-active');
    tabContentHistory.classList.remove('tab-active');
  });

  displayProgress();
});
