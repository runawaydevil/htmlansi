export const GENERATOR_SIGNATURE = 'made by runv.sh github: runawaydebil';

export const CREATOR_NAME = 'runv';
export const CREATOR_SITE = 'https://runv.sh';
export const CREATOR_EMAIL = 'r@runv.sh';

export function getCreatorMetaHtml(): string {
  return [
    `<meta name="author" content="${CREATOR_NAME}">`,
    `<link rel="author" href="${CREATOR_SITE}" title="${CREATOR_NAME}">`,
    `<meta name="creator-email" content="${CREATOR_EMAIL}">`,
  ].join('\n');
}
