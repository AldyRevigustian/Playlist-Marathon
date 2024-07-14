chrome.runtime.onInstalled.addListener(() => {
  console.log('YouTube Playlist Tracker installed.');
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'getProgress') {
    chrome.storage.local.get(['playlistProgress'], (result) => {
      sendResponse(result.playlistProgress || []);
    });
    return true;
  } else if (request.type === 'setProgress') {
    chrome.storage.local.set({ playlistProgress: request.data }, () => {
      sendResponse({ success: true });
    });
    return true;
  } else if (request.type === 'addPlaylist') {
    chrome.storage.local.get(['playlistProgress'], (result) => {
      let progress = result.playlistProgress || [];
      progress.push({ playlistId: request.data.playlistId, name: request.data.name, videoId: request.data.videoId });
      chrome.storage.local.set({ playlistProgress: progress }, () => {
        sendResponse({ success: true });
      });
    });
    return true;
  }
});
