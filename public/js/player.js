const params = new URLSearchParams(window.location.search);
const videoId = params.get("id");

async function loadVideo() {
  const video = await getVideo(videoId);

  document.getElementById("player").src = video.videoFile;

  document.getElementById("title").innerText = video.title;

  document.getElementById("channel").innerText =
    `Uploaded by ${video.owner.username}`;
}

loadVideo();
