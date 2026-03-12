async function loadVideos() {
  const grid = document.getElementById("videoGrid");

  const videos = await getVideos();

  grid.innerHTML = "";

  videos.forEach((video) => {
    const card = document.createElement("div");
    card.className = "video-card";

    card.innerHTML = `

<img src="${video.thumbnail}" />

<div class="video-info">
<div class="video-title">${video.title}</div>

<div class="channel">
${video.owner.username}
</div>

</div>

`;

    card.onclick = () => {
      window.location = `video.html?id=${video._id}`;
    };

    grid.appendChild(card);
  });
}
loadVideos();
