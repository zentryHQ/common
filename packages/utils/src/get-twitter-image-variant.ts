export type ImageVariant = 'normal' | 'bigger' | 'mini' | 'original';

/**
 * https://developer.twitter.com/en/docs/twitter-api/v1/accounts-and-users/user-profile-images-and-banners
 */
export function getTwitterImageVariant(
    src: string,
    variant: ImageVariant
): string {
    if (!src || !src.includes('pbs.twimg.com')) {
        return src;
    }
    try {
        if (variant === 'original') {
            // Remove any existing size specification in the URL
            return src.replace(
                /_(normal|bigger|mini)(\.jpeg|\.jpg|\.png)$/,
                '$2'
            );
        } else {
            // Remove the existing size specification and add the new variant
            return src.replace(
                /(_normal|_bigger|_mini)?(\.jpeg|\.jpg|\.png)$/,
                `_${variant}$2`
            );
        }
    } catch (e) {
        console.error(e);
        return src;
    }
}
