import words from "./words.js";

const WORD_DELAY_MS = 1000;
const LOCAL_STORAGE_NAME = "smilies";

(async () => {
  const voice = await getVoice();
  const wordFamily = document.getElementById("word-family");
  const wordContainer = document.getElementById("word");
  const counter = document.getElementById("counter");
  const progress = document.getElementById("progress");
  const image = document.getElementById("image");
  const queryString = parseQueryString();
  const list = [];
  const wordLists = setUpWords(queryString.rounds, queryString.number);

  if (Object.hasOwn(queryString, "end")) {
    finished(true);
    return;
  }

  let currentWordIndex;
  let totalWords;
  setUpProgressBar(progress, wordLists);
  nextWord();

  const speakButton = document.getElementById("speak");
  speakButton.addEventListener("click", () => {
    speak(wordContainer.innerText);
  });

  const next = document.getElementById("next");
  next.addEventListener("click", async () => {
    if (next.disabled) return;

    nextWord();
    next.disabled = true;
  });

  // The speech synthesis is loaded asynchronously,
  // so we need to poll it in order to populate the list
  async function getVoice() {
    const desiredLanguge = "sv-SE";
    const voices = await new Promise((resolve) => {
      const interval = setInterval(() => {
        const voiceArray = window.speechSynthesis.getVoices();
        if (voiceArray.length > 0) {
          resolve(voiceArray);
          clearInterval(interval);
        }
      }, 50);
    });

    return voices
      .find((item) => {
        // Sometimes, the language and country code is
        // separated with underscore, and sometimes with a hyphen...
        return item.lang.replace("_", "-") === desiredLanguge;
      });
  }

  function speak(word) {
    if (window.speechSynthesis.speaking) return;

    // Use lower-case to avoid making the TTS thinking the word is an abbreviation
    const utterance = new SpeechSynthesisUtterance(word.toLowerCase());
    utterance.voice = voice;
    utterance.rate = 0.75;
    window.speechSynthesis.speak(utterance);
  }

  function nextWord() {
    list.shift();
    ++currentWordIndex;
    ++progress.value;

    const wordDelayMs = queryString.delay;

    setTimeout(() => {
      next.disabled = false;
    }, wordDelayMs ?? WORD_DELAY_MS);

    if (list.length === 0) {
      if (wordLists.length === 0) {
        finished();
        return;
      }

      const [name, values] = wordLists.shift();
      list.push(...shuffleNoRepeat(values));

      totalWords = values.length;
      currentWordIndex = 1;
      wordFamily.innerText = name;
    }

    const word = list[0];
    const imageUrl = `./img/${word}.svg`;
    wordContainer.innerText = word;
    image.style.backgroundImage = `url(${imageUrl})`;
    counter.innerText = `${currentWordIndex}/${totalWords}`;
    tryLoadingImage(image, imageUrl);
  }
})();

function tryLoadingImage(image, source) {
  const preload = document.createElement("img");
  preload.onerror = () => {
    image.style.backgroundImage = "url(./img/question-mark.svg)";
  };
  preload.src = source;
}

function setUpWords(rounds = 3, number = 2) {
  const wordArray = Object.entries(words)
    .reduce((acc, [key, values]) => {
      const newValues = [...values];
      for (let i = 1; i < rounds; ++i) {
        newValues.push(...values);
      }
      acc.push([key, shuffleNoRepeat(newValues)]);
      return acc;

    }, []);

  return shuffleNoRepeat(wordArray).slice(0, number);
}

function setUpProgressBar(progress, wordLists) {
  const max = wordLists.reduce((acc, current) => {
    return acc + current[1].length;
  }, 0);
  progress.value = 0;
  progress.max = max;
}

function finished(forceNew = false) {
  const today = getDate();
  const greating =
    randomElement([
      "Färdig",
      "Bra jobbat",
      "Stark kämpat",
      "Klar",
    ]);
  const markup = [
    `<h1>${greating}!</h1>`,
  ];
  let smilies;

  try {
    smilies = JSON.parse(localStorage.getItem(LOCAL_STORAGE_NAME));
    if (!smilies) {
      throw new Error("No smiley history");
    }
  } catch {
    smilies = {};
  }

  if (!smilies[today] || forceNew) {
    const smiley = getRandomSmiley();
    smilies[today] = smiley;
    localStorage.setItem(LOCAL_STORAGE_NAME, JSON.stringify(smilies));
    markup.push(`<div id="smiley" class="fadein">${smiley}</div>`);
  } else {
    markup.push("Dagens smiley är redan insamlad!");
  }

  markup.push(`Samlade smilies: ${Object.keys(smilies).length}`);

  document.body.innerHTML = markup.join("\n");

  // Wiggle smiley when clicked
  const smiley = document.getElementById("smiley");
  smiley.addEventListener("animationend", () => {
    if (smiley.classList.contains("fadein")) {
      smiley.classList.remove("fadein");
      smiley.classList.add("wiggle");
    } else {
      smiley.classList.remove("wiggle");
    }
  });
  smiley.addEventListener("click", () => {
    smiley.classList.add("wiggle");
  });
}

function getDate() {
  return new Date().toLocaleDateString("sv-SE", {
    year: "numeric",
    month: "numeric",
    day: "numeric"});
}

function getRandomSmiley() {
  const smilies = [
    "😃", "😄", "😁", "😆", "🙂", "😊",
    "😇", "🥰", "😍", "🤩", "🤗", "🤠",
    "🥳", "😎", "🤓", "😸", "😹", "😻",
  ];
  return randomElement(smilies);
}

function parseQueryString() {
  return location.search
    .slice(1)
    .split("&")
    .reduce((acc, current) => {
      const [key, value] = current.split("=");
      acc[key] = value;
      return acc;
    }, {});
}

function shuffleNoRepeat(array) {
  const arrayCopy = array.slice();
  const shuffledArray = [];
  let previous = null;

  while (shuffledArray.length < array.length) {
    const randomIndex = getRandomIndex(arrayCopy);
    const [ randomItem ] = arrayCopy.splice(randomIndex, 1);

    if (randomItem === previous && arrayCopy.length > 1) {
      arrayCopy.push(randomItem);
    } else {
      previous = randomItem;
      shuffledArray.push(randomItem);
    }
  }

  // Sometimes the last two items are identical.
  // Swap the last item with the first differing item
  const ultimateItem = shuffledArray.at(-1);
  const penultimateItem = shuffledArray.at(-2);

  if (ultimateItem === penultimateItem) {
    const newIndex = shuffledArray.findIndex((item) => item !== ultimateItem);
    const temp = shuffledArray[newIndex];
    shuffledArray[newIndex] = ultimateItem;
    shuffledArray[shuffledArray.length - 1] = temp;
  }

  return shuffledArray;
}

function getRandomIndex(array) {
  return Math.floor(Math.random() * array.length);
}

function randomElement(array) {
  const randomIndex = getRandomIndex(array);
  return array[randomIndex];
}
