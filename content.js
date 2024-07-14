(function() {
  let currentVideoId = '';
  let currentPlaylistId = '';
  let currentIndex = 0;

  function getVideoDetails() {
    const urlParams = new URLSearchParams(window.location.search);
    return {
      videoId: urlParams.get('v'),
      playlistId: urlParams.get('list'),
      index: urlParams.get('index')
    };
  }

  function trackVideo() {
    const { videoId, playlistId, index } = getVideoDetails();
    if (videoId && videoId !== currentVideoId) {
      currentVideoId = videoId;
      currentPlaylistId = playlistId;
      currentIndex = index;
      chrome.runtime.sendMessage({ type: 'getProgress' }, (response) => {
        let progress = response || [];
        const existingEntry = progress.find(item => item.playlistId === playlistId);
        if (existingEntry) {
          existingEntry.videoId = videoId;
          existingEntry.index = index;
        } else {
          progress.push({ videoId, playlistId, index, name: '' });
        }
        chrome.runtime.sendMessage({ type: 'setProgress', data: progress }, (response) => {
          console.log('Progress updated:', response.success);
        });
      });
    }
  }

  setInterval(trackVideo, 1000);
})();
