(function () {
  let currentVideoId = '';
  let currentPlaylistId = '';
  function getVideoDetails() {
    const urlParams = new URLSearchParams(window.location.search);
    return {
      videoId: urlParams.get('v'),
      playlistId: urlParams.get('list'),
    };
  }

  function trackVideo() {
    const { videoId, playlistId } = getVideoDetails();

    if (videoId != currentVideoId && playlistId != null && videoId != null) {
      currentVideoId = videoId;
      currentPlaylistId = playlistId;
      chrome.runtime.sendMessage({ type: 'getProgress' }, (response) => {
        let progress = response || [];
        const existingEntry = progress.find(item => item.playlistId === playlistId);
        if (existingEntry) {
          existingEntry.videoId = videoId;
        }
        chrome.runtime.sendMessage({ type: 'setProgress', data: progress }, (response) => {
          console.log('Progress updated:', response.success);
        });
      });
    }
  }

  setInterval(trackVideo, 1000);
})();
