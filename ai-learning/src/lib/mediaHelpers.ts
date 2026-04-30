//Archivo temporal, posiblemente lo integraré en courseService.ts o lo dejaré como helper para otros tipos de media

export function isYoutubeUrl(url: string) {
    return /youtube\.com|youtu\.be/.test(url);
  }
  
  export function getYoutubeEmbedUrl(url: string) {
    const regExp = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/;
    const match = url.match(regExp);
    return match ? `https://www.youtube.com/embed/${match[1]}` : null;
  }
  
  export function isDirectVideoFile(url: string) {
    return /\.(mp4|webm|ogg)$/i.test(url);
  }