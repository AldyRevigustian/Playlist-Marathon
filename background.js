chrome.runtime.onInstalled.addListener(() => {
  console.log('YouTube Playlist Tracker installed.');
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.type) {
    case 'getProgress':
      chrome.storage.local.get(['playlistProgress'], (result) => {
        sendResponse(result.playlistProgress || []);
      });
      return true;

    case 'setProgress':
      (async () => {
        const indexStr = await getIndex(`https://www.youtube.com/watch?v=${request.data[0].videoId}&list=${request.data[0].playlistId}`);
        request.data[0].indexStr = indexStr;

        chrome.storage.local.set({ playlistProgress: request.data }, () => {
          sendResponse({ success: true });
        });
      })();
      return true;

    case 'addPlaylist':
      chrome.storage.local.get(['playlistProgress'], (result) => {
        const progress = result.playlistProgress || [];
        progress.push({ playlistId: request.data.playlistId, name: request.data.name, videoId: request.data.videoId });

        chrome.storage.local.set({ playlistProgress: progress }, () => {
          sendResponse({ success: true });
        });
      });
      return true;

    case 'clearProgress':
      chrome.storage.local.set({ playlistProgress: [] }, () => {
        sendResponse({ success: true });
      });
      return true;

    default:
      return false;
  }
});

async function getIndex(url) {
  console.log(url);

  try {
    const response = await fetch(url, { headers: { 'Content-Type': 'text/html' } });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const text = await response.text();
    const pattern = /"currentIndex":\s*(\d+),\s*"playlistId":\s*"([^"]+)",\s*"totalVideos":\s*(\d+)/;
    const match = text.match(pattern);

    if (match) {
      const currentIndex = parseInt(match[1]) + 1;
      const totalVideos = match[3];
      const result = `${currentIndex} / ${totalVideos}`;

      console.log(result);
      return result;
    } else {
      console.log('Pattern not found');
      return "0 / 0 Video";
    }
  } catch (error) {
    console.error('Error fetching playlist:', error);
    return "0 / 0 Video";
  }
}
