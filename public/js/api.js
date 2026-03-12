// const API = "http://localhost:7000/api/v1";
// const API = "https://vidtube-mern-project.onrender.com/api/v1";
const API =
  window.location.hostname === "localhost"
    ? "http://localhost:7000/api/v1"
    : "https://vidtube-mern-project.onrender.com/api/v1";

async function getVideos() {
  const res = await fetch(`${API}/videos`, {
    credentials: "include", // ← ADD THIS
  });
  const data = await res.json();

  return data.data;
}

async function getVideo(id) {
  const res = await fetch(`${API}/videos/${id}`, {
    credentials: "include", // ← ADD THIS
  });
  const data = await res.json();

  return data.data;
}
