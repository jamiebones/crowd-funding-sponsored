const isPdf = (url: string = "") => {
    const spString = url.split(":");
    if (spString && spString[1].includes("pdf")) {
      return true;
    }
    return false;
  };

  const formatRelativeTime = (timestamp: number) => {
    const now = Math.floor(Date.now() / 1000);
    const diff = now - timestamp;
    
    const minute = 60;
    const hour = minute * 60;
    const day = hour * 24;
    const week = day * 7;
    const month = day * 30;
    const year = day * 365;
  
    if (diff < minute) return 'just now';
    if (diff < hour) return `${Math.floor(diff / minute)} minute${Math.floor(diff / minute) > 1 ? 's' : ''} ago`;
    if (diff < day) return `${Math.floor(diff / hour)} hour${Math.floor(diff / hour) > 1 ? 's' : ''} ago`;
    if (diff < week) return `${Math.floor(diff / day)} day${Math.floor(diff / day) > 1 ? 's' : ''} ago`;
    if (diff < month) return `${Math.floor(diff / week)} week${Math.floor(diff / week) > 1 ? 's' : ''} ago`;
    if (diff < year) return `${Math.floor(diff / month)} month${Math.floor(diff / month) > 1 ? 's' : ''} ago`;
    return `${Math.floor(diff / year)} year${Math.floor(diff / year) > 1 ? 's' : ''} ago`;
  };


  export { isPdf, formatRelativeTime };