import { RegExpMatcher, TextCensor, englishDataset, englishRecommendedTransformers } from "obscenity";

const censor = new TextCensor();
const matcher = new RegExpMatcher({
  ...englishDataset.build(),
  ...englishRecommendedTransformers,
});

export const isProfane = (text: string) => {
  return matcher.hasMatch(text);
};

export const censorText = (text: string) => {
  const matches = matcher.getAllMatches(text.toString());

  return censor.applyTo(text, matches);
};
