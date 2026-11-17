// Deep-link builders. Honest design: Uber/Zomato/BookMyShow give no public booking
// APIs to indie builders, so the bot does everything in chat and hands over ONE
// pre-filled link — the user only taps the final confirm in the app.
// Line Free India is our own platform, so that link goes straight into the product.

const enc = encodeURIComponent;

function uberLink({ pickup, drop }) {
  // Uber universal link — opens with pickup = current location, dropoff pre-filled.
  let url = 'https://m.uber.com/ul/?action=setPickup&pickup=my_location';
  if (drop) url += `&dropoff[formatted_address]=${enc(drop)}`;
  return url;
}

function zomatoLink({ item }) {
  // Zomato search deep link (defaults to delivery search for the dish/restaurant).
  const q = item ? enc(item) : 'food';
  return `https://www.zomato.com/delivery?q=${q}`;
}

function swiggyLink({ item }) {
  const q = item ? enc(item) : 'food';
  return `https://www.swiggy.com/search?query=${q}`;
}

function bookMyShowLink({ movie, city }) {
  const c = (city || 'gaya').toLowerCase().replace(/\s+/g, '-');
  if (movie) return `https://in.bookmyshow.com/explore/movies-${c}?q=${enc(movie)}`;
  return `https://in.bookmyshow.com/explore/home/${c}`;
}

function lineFreeIndiaLink() {
  // Our own platform — the bot later books tokens directly over the Firebase API.
  return 'https://line-free-india.web.app';
}

module.exports = { uberLink, zomatoLink, swiggyLink, bookMyShowLink, lineFreeIndiaLink };
