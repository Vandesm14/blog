// Format Time
obj.time = new Date(obj.date).toLocaleString().split(', ')[1].replace(/:\d\d([ ap]|$)/, ' ');

// Format Date
obj.date = new String(new Date(obj.date)).split(' ').splice(0, 3).join(' ');