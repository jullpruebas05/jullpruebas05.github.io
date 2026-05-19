/**
 * Carga videos desde RSS de YouTube (sin API key)
 * Compatible con CORS usando rss2json.com
 */

async function loadYouTubeFeed(channelId, containerId, limit = 6) {
  const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
  const proxyUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`;
  
  try {
    const response = await fetch(proxyUrl);
    const data = await response.json();
    
    if (data.status !== 'ok') throw new Error('Error al cargar feed');
    
    const container = document.getElementById(containerId);
    const videos = data.items.slice(0, limit);
    
    container.innerHTML = videos.map(video => {
      const videoId = video.videoId;
      const thumbnail = video.thumbnail.replace('default', 'mqdefault');
      const published = new Date(video.pubDate).toLocaleDateString('es-VE', {
        day: '2-digit', month: 'short'
      });
      
      return `
        <a href="${video.link}" target="_blank" class="video-card">
          <img src="${thumbnail}" alt="${video.title}" loading="lazy">
          <div class="video-info">
            <h4>${video.title}</h4>
            <div class="video-meta">📅 ${published}</div>
          </div>
        </a>
      `;
    }).join('');
    
  } catch (error) {
    console.error(`Error cargando ${containerId}:`, error);
    document.getElementById(containerId).innerHTML = 
      '<p style="color:var(--text-muted)">⚠️ No se pudieron cargar los videos. Intenta más tarde.</p>';
  }
}

async function loadShortsFeed(channels, containerId, limit = 3) {
  // Nota: YouTube RSS no filtra Shorts nativamente.
  // Solución: Mostramos los últimos videos y el usuario identifica Shorts por título/miniatura.
  // Para filtrar por duración, necesitarías API (no disponible). 
  // Alternativa: Usa hashtags #Shorts en los títulos y filtra aquí si lo deseas.
  
  const container = document.getElementById(containerId);
  let allVideos = [];
  
  // Cargar de los 3 canales y mezclar
  for (const [name, id] of Object.entries(channels)) {
    const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${id}`;
    const proxyUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`;
    
    try {
      const res = await fetch(proxyUrl);
      const data = await res.json();
      if (data.status === 'ok') {
        // Filtrar por título que contenga #Shorts o duración <60s (si está disponible)
        const shorts = data.items.filter(v => 
          v.title.toLowerCase().includes('#shorts') || 
          v.title.toLowerCase().includes('short')
        ).slice(0, 2);
        allVideos = [...allVideos, ...shorts];
      }
    } catch (e) { console.warn(`Error en ${name}:`, e); }
  }
  
  // Mezclar y limitar
  const selected = allVideos.sort(() => Math.random() - 0.5).slice(0, limit);
  
  container.innerHTML = selected.map(video => {
    const videoId = video.videoId;
    const thumbnail = video.thumbnail.replace('default', 'mqdefault');
    return `
      <a href="${video.link}" target="_blank" class="short-card">
        <img src="${thumbnail}" alt="${video.title}" loading="lazy">
      </a>
    `;
  }).join('');
}
