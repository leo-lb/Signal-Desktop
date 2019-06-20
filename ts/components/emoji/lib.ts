// @ts-ignore: untyped json
import untypedData from 'emoji-datasource';
import {
  compact,
  flatMap,
  groupBy,
  isNumber,
  keyBy,
  map,
  mapValues,
  sortBy,
} from 'lodash';
import Fuse from 'fuse.js';

export type ValuesOf<T extends Array<any>> = T[number];

export const skinTones = ['1F3FB', '1F3FC', '1F3FD', '1F3FE', '1F3FF'];

export type SkinToneKey = '1F3FB' | '1F3FC' | '1F3FD' | '1F3FE' | '1F3FF';

export type EmojiSkinVariation = {
  unified: string;
  non_qualified: null;
  image: string;
  sheet_x: number;
  sheet_y: number;
  added_in: string;
  has_img_apple: boolean;
  has_img_google: boolean;
  has_img_twitter: boolean;
  has_img_emojione: boolean;
  has_img_facebook: boolean;
  has_img_messenger: boolean;
};

export type EmojiData = {
  name: string;
  unified: string;
  non_qualified: string | null;
  docomo: string | null;
  au: string | null;
  softbank: string | null;
  google: string | null;
  image: string;
  sheet_x: number;
  sheet_y: number;
  short_name: string;
  short_names: Array<string>;
  text: string | null;
  texts: Array<string> | null;
  category: string;
  sort_order: number;
  added_in: string;
  has_img_apple: boolean;
  has_img_google: boolean;
  has_img_twitter: boolean;
  has_img_emojione: boolean;
  has_img_facebook: boolean;
  has_img_messenger: boolean;
  skin_variations?: {
    [key: string]: EmojiSkinVariation;
  };
};

const data = (untypedData as Array<EmojiData>).filter(
  emoji => emoji.has_img_apple
);

const makeImagePath = (src: string) => {
  return `node_modules/emoji-datasource-apple/img/apple/64/${src}`;
};

export const images = new Set();

// Preload images
const preload = (src: string) => {
  const img = new Image();
  img.src = src;
  images.add(img);
};

data.forEach(emoji => {
  preload(makeImagePath(emoji.image));

  if (emoji.skin_variations) {
    Object.values(emoji.skin_variations).forEach(variation => {
      preload(makeImagePath(variation.image));
    });
  }
});

export const dataByShortName = keyBy(data, 'short_name');

data.forEach(emoji => {
  const { short_names } = emoji;
  if (short_names) {
    short_names.forEach(name => {
      dataByShortName[name] = emoji;
    });
  }
});

export const dataByCategory = mapValues(
  groupBy(data, ({ category }) => {
    if (category === 'Activities') {
      return 'activity';
    }

    if (category === 'Animals & Nature') {
      return 'animal';
    }

    if (category === 'Flags') {
      return 'flag';
    }

    if (category === 'Food & Drink') {
      return 'food';
    }

    if (category === 'Objects') {
      return 'object';
    }

    if (category === 'Travel & Places') {
      return 'travel';
    }

    if (category === 'Smileys & People') {
      return 'emoji';
    }

    if (category === 'Symbols') {
      return 'symbol';
    }

    return 'misc';
  }),
  arr => sortBy(arr, 'sort_order')
);

export function getEmojiData(
  shortName: keyof typeof dataByShortName,
  skinTone?: SkinToneKey | number
): EmojiData | EmojiSkinVariation {
  const base = dataByShortName[shortName];

  if (skinTone && base.skin_variations) {
    const variation = isNumber(skinTone) ? skinTones[skinTone - 1] : skinTone;

    return base.skin_variations[variation];
  }

  return base;
}

export function getImagePath(
  shortName: keyof typeof dataByShortName,
  skinTone?: SkinToneKey | number
): string {
  const { image } = getEmojiData(shortName, skinTone);

  return makeImagePath(image);
}

const fuse = new Fuse(data, {
  shouldSort: true,
  threshold: 0.3,
  location: 4,
  distance: 10,
  maxPatternLength: 32,
  minMatchCharLength: 1,
  keys: ['name', 'short_name', 'short_names'],
});

export function search(query: string) {
  return fuse.search(query.substr(0, 32));
}

const shortNames = new Set([
  ...map(data, 'short_name'),
  ...compact<string>(flatMap(data, 'short_names')),
]);

export function isShortName(name: string) {
  return shortNames.has(name);
}

export function unifiedToEmoji(unified: string) {
  return unified
    .split('-')
    .map(c => String.fromCodePoint(parseInt(c, 16)))
    .join('');
}

export function hasVariation(shortName: string, skinTone: number = 0) {
  if (skinTone === 0) {
    return false;
  }

  const base = dataByShortName[shortName];
  if (!base) {
    return false;
  }

  if (skinTone > 0 && base.skin_variations) {
    const toneKey = skinTones[skinTone - 1];

    return Boolean(base.skin_variations[toneKey]);
  }

  return false;
}

export function convertShortName(shortName: string, skinTone: number = 0) {
  const base = dataByShortName[shortName];

  if (!base) {
    return '';
  }

  if (skinTone > 0 && base.skin_variations) {
    const toneKey = skinTones[skinTone - 1];
    const variation = base.skin_variations[toneKey];
    if (variation) {
      return unifiedToEmoji(variation.unified);
    }
  }

  return unifiedToEmoji(base.unified);
}

export function replaceColons(str: string) {
  return str.replace(/:[a-z0-9-_+]+:(?::skin-tone-[1-5]:)?/gi, m => {
    const [shortName = '', skinTone = '0'] = m
      .replace('skin-tone-', '')
      .split(':')
      .filter(Boolean);

    if (shortName && isShortName(shortName)) {
      return convertShortName(shortName, parseInt(skinTone, 10));
    }

    return m;
  });
}
