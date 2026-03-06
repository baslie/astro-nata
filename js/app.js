var Origin = CircularNatalHoroscope.Origin;
var Horoscope = CircularNatalHoroscope.Horoscope;

const ZODIAC_SIGNS = [
  'Овен', 'Телец', 'Близнецы', 'Рак', 'Лев', 'Дева',
  'Весы', 'Скорпион', 'Стрелец', 'Козерог', 'Водолей', 'Рыбы'
];

function getZodiacSign(degrees) {
  const index = Math.floor(degrees / 30) % 12;
  return ZODIAC_SIGNS[index];
}

function formatPosition(degrees) {
  var signIndex = Math.floor(degrees / 30) % 12;
  var degInSign = Math.floor(degrees % 30);
  var fractional = degrees % 1;
  var minFloat = fractional * 60;
  var minutes = Math.floor(minFloat);
  var seconds = Math.floor((minFloat - minutes) * 60);
  return degInSign + '\u00B0' + (minutes < 10 ? '0' : '') + minutes + '\''
       + (seconds < 10 ? '0' : '') + seconds + '" ' + ZODIAC_SIGNS[signIndex];
}

var PLANET_NAMES = {
  sun: 'Солнце', moon: 'Луна', mercury: 'Меркурий', venus: 'Венера',
  mars: 'Марс', jupiter: 'Юпитер', saturn: 'Сатурн',
  uranus: 'Уран', neptune: 'Нептун', pluto: 'Плутон',
  chiron: 'Хирон'
};

const coordsBlock = document.getElementById('coordsBlock');
const latInput = document.getElementById('lat');
const lngInput = document.getElementById('lng');
const form = document.getElementById('birthForm');

// DMS elements
var dmsElements = {
  lat: {
    deg: document.getElementById('lat-deg'),
    min: document.getElementById('lat-min'),
    sec: document.getElementById('lat-sec'),
    dir: document.getElementById('lat-dir')
  },
  lng: {
    deg: document.getElementById('lng-deg'),
    min: document.getElementById('lng-min'),
    sec: document.getElementById('lng-sec'),
    dir: document.getElementById('lng-dir')
  }
};

function ddToDms(dd) {
  var negative = dd < 0;
  var abs = Math.abs(dd);
  var degrees = Math.floor(abs);
  var minFloat = (abs - degrees) * 60;
  var minutes = Math.floor(minFloat);
  var seconds = parseFloat(((minFloat - minutes) * 60).toFixed(2));
  if (seconds >= 60) { seconds = 0; minutes++; }
  if (minutes >= 60) { minutes = 0; degrees++; }
  return { degrees: degrees, minutes: minutes, seconds: seconds, negative: negative };
}

function dmsToDd(deg, min, sec, dir) {
  var dd = deg + min / 60 + sec / 3600;
  if (dir === 'S' || dir === 'W') dd = -dd;
  return parseFloat(dd.toFixed(4));
}

var syncing = false;

function syncDdToDms(coord) {
  if (syncing) return;
  syncing = true;
  var ddInput = coord === 'lat' ? latInput : lngInput;
  var els = dmsElements[coord];
  var val = parseFloat(ddInput.value);
  if (isNaN(val)) {
    els.deg.value = '';
    els.min.value = '';
    els.sec.value = '';
    syncing = false;
    return;
  }
  var dms = ddToDms(val);
  els.deg.value = dms.degrees;
  els.min.value = dms.minutes;
  els.sec.value = dms.seconds;
  if (coord === 'lat') {
    els.dir.value = dms.negative ? 'S' : 'N';
  } else {
    els.dir.value = dms.negative ? 'W' : 'E';
  }
  syncing = false;
}

function syncDmsToDd(coord) {
  if (syncing) return;
  syncing = true;
  var els = dmsElements[coord];
  var deg = parseInt(els.deg.value) || 0;
  var min = parseInt(els.min.value) || 0;
  var sec = parseFloat(els.sec.value) || 0;
  var dir = els.dir.value;
  var ddInput = coord === 'lat' ? latInput : lngInput;
  ddInput.value = dmsToDd(deg, min, sec, dir);
  syncing = false;
}

// DD → DMS listeners
latInput.addEventListener('input', function () { syncDdToDms('lat'); });
lngInput.addEventListener('input', function () { syncDdToDms('lng'); });

// DMS → DD listeners
['lat', 'lng'].forEach(function (coord) {
  var els = dmsElements[coord];
  ['deg', 'min', 'sec'].forEach(function (part) {
    els[part].addEventListener('input', function () { syncDmsToDd(coord); });
  });
  els.dir.addEventListener('change', function () { syncDmsToDd(coord); });
});

// Geoapify Geocoder Autocomplete
// Получите бесплатный API-ключ на https://myprojects.geoapify.com/
// 1. Зарегистрируйтесь → 2. Создайте проект → 3. Скопируйте ключ сюда:
const GEOAPIFY_KEY = '118fc159180f4c908b36ff0473e93ac5';

const cityContainer = document.getElementById('city-autocomplete');
cityContainer.innerHTML = '';
const cityAutocomplete = new autocomplete.GeocoderAutocomplete(cityContainer, GEOAPIFY_KEY, {
  type: 'city',
  lang: 'ru',
  placeholder: 'Начните вводить город...',
  limit: 5,
});

const tzInfo = document.getElementById('tz-info');
var selectedTimezone = null;

function getUtcOffset(timezoneName, date) {
  try {
    var utcStr = date.toLocaleString('en-US', { timeZone: 'UTC' });
    var tzStr = date.toLocaleString('en-US', { timeZone: timezoneName });
    var diffMs = new Date(tzStr) - new Date(utcStr);
    var diffMinutes = Math.round(diffMs / 60000);
    var sign = diffMinutes >= 0 ? '+' : '-';
    var absMin = Math.abs(diffMinutes);
    var h = String(Math.floor(absMin / 60)).padStart(2, '0');
    var m = String(absMin % 60).padStart(2, '0');
    return 'UTC' + sign + h + ':' + m;
  } catch (e) {
    return '';
  }
}

function updateTzInfo() {
  if (!selectedTimezone) {
    tzInfo.textContent = '';
    return;
  }
  var dateStr = document.getElementById('birthdate').value;
  var timeStr = document.getElementById('birthtime').value;
  var date;
  if (dateStr) {
    var parts = dateStr.split('-').map(Number);
    var timeParts = timeStr ? timeStr.split(':').map(Number) : [12, 0];
    date = new Date(parts[0], parts[1] - 1, parts[2], timeParts[0], timeParts[1]);
  } else {
    date = new Date();
  }
  var offset = getUtcOffset(selectedTimezone, date);
  tzInfo.textContent = selectedTimezone + (offset ? ' (' + offset + ')' : '');
}

document.getElementById('birthdate').addEventListener('change', updateTzInfo);
document.getElementById('birthtime').addEventListener('change', updateTzInfo);

cityAutocomplete.on('select', function (location) {
  if (location) {
    latInput.value = parseFloat(location.properties.lat).toFixed(4);
    lngInput.value = parseFloat(location.properties.lon).toFixed(4);
    syncDdToDms('lat');
    syncDdToDms('lng');
    selectedTimezone = location.properties.timezone ? location.properties.timezone.name : null;
  } else {
    latInput.value = '';
    lngInput.value = '';
    syncDdToDms('lat');
    syncDdToDms('lng');
    selectedTimezone = null;
  }
  updateTzInfo();
});

form.addEventListener('submit', function (e) {
  e.preventDefault();

  const dateStr = document.getElementById('birthdate').value;
  const timeStr = document.getElementById('birthtime').value;
  const lat = parseFloat(latInput.value);
  const lng = parseFloat(lngInput.value);

  if (!dateStr || !timeStr) {
    alert('Укажите дату и время рождения');
    return;
  }
  if (isNaN(lat) || isNaN(lng)) {
    alert('Укажите координаты (выберите город или введите вручную)');
    return;
  }

  const [year, month, date] = dateStr.split('-').map(Number);
  const [hour, minute] = timeStr.split(':').map(Number);

  const origin = new Origin({
    year: year,
    month: month - 1, // 0-indexed
    date: date,
    hour: hour,
    minute: minute,
    latitude: lat,
    longitude: lng,
  });

  const horoscope = new Horoscope({
    origin: origin,
    houseSystem: 'placidus',
    zodiac: 'tropical',
    aspectPoints: ['bodies', 'points', 'angles'],
    aspectTypes: ['major', 'minor'],
    language: 'en',
  });

  // Маппинг планет
  const chartPlanets = Object.assign(
    {},
    ...horoscope.CelestialBodies.all
      .filter(function (b) { return b.key !== 'sirius'; })
      .map(function (body) {
        var key = body.key.charAt(0).toUpperCase() + body.key.slice(1);
        return { [key]: [body.ChartPosition.Ecliptic.DecimalDegrees, body.isRetrograde ? -1 : 1] };
      })
  );

  // Добавить NNode и Lilith из CelestialPoints
  if (horoscope.CelestialPoints.northnode) {
    chartPlanets.NNode = [horoscope.CelestialPoints.northnode.ChartPosition.Ecliptic.DecimalDegrees];
  }
  if (horoscope.CelestialPoints.lilith) {
    chartPlanets.Lilith = [horoscope.CelestialPoints.lilith.ChartPosition.Ecliptic.DecimalDegrees];
  }

  // Маппинг домов
  const chartCusps = horoscope.Houses.map(function (c) {
    return c.ChartPosition.StartPosition.Ecliptic.DecimalDegrees;
  });

  // Углы (эклиптические долготы)
  const ascEcliptic = horoscope.Ascendant.ChartPosition.Ecliptic.DecimalDegrees;
  const mcEcliptic = horoscope.Midheaven.ChartPosition.Ecliptic.DecimalDegrees;
  // Горизонтные координаты для визуализации карты
  const asc = horoscope.Ascendant.ChartPosition.Horizon.DecimalDegrees;
  const desc = (asc + 180) % 360;
  const mc = horoscope.Midheaven.ChartPosition.Horizon.DecimalDegrees;
  const ic = (mc + 180) % 360;

  // Рендер карты
  var chartEl = document.getElementById('chart');
  chartEl.innerHTML = '';
  var chartSize = 800;
  var chart = new astrology.Chart('chart', chartSize, chartSize);
  var radix = chart.radix({ planets: chartPlanets, cusps: chartCusps });
  radix.addPointsOfInterest({ As: [asc], Mc: [mc], Ds: [desc], Ic: [ic] });
  radix.aspects();

  var svgEl = chartEl.querySelector('svg');
  if (svgEl) {
    svgEl.removeAttribute('width');
    svgEl.removeAttribute('height');
    svgEl.style.overflow = 'visible';
  }

  // Текстовая информация
  var infoBlock = document.getElementById('info');
  var infoList = document.getElementById('infoList');
  infoBlock.hidden = false;
  infoList.innerHTML = '';

  var items = [];

  // Планеты
  horoscope.CelestialBodies.all
    .filter(function (b) { return b.key !== 'sirius'; })
    .forEach(function (body) {
      var deg = body.ChartPosition.Ecliptic.DecimalDegrees;
      var name = PLANET_NAMES[body.key] || body.key;
      var retro = body.isRetrograde ? ' \u211E' : '';
      items.push('<strong>' + name + ':</strong> ' + formatPosition(deg) + retro);
    });

  // Сев. узел
  if (horoscope.CelestialPoints && horoscope.CelestialPoints.northnode) {
    var nn = horoscope.CelestialPoints.northnode.ChartPosition.Ecliptic.DecimalDegrees;
    items.push('<strong>Сев. узел:</strong> ' + formatPosition(nn));
  }

  // Лилит
  if (horoscope.CelestialPoints && horoscope.CelestialPoints.lilith) {
    var lil = horoscope.CelestialPoints.lilith.ChartPosition.Ecliptic.DecimalDegrees;
    items.push('<strong>Лилит:</strong> ' + formatPosition(lil));
  }

  // Асцендент и MC
  items.push('<strong>Асцендент:</strong> ' + formatPosition(ascEcliptic));
  items.push('<strong>Мидхевен (MC):</strong> ' + formatPosition(mcEcliptic));

  items.forEach(function (text) {
    var li = document.createElement('li');
    li.innerHTML = text;
    infoList.appendChild(li);
  });
});
