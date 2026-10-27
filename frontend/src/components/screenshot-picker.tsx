import { ImagePlus, X } from 'lucide-react-native';
import { useEffect, useRef } from 'react';
import { Image, Pressable, Text, View } from 'react-native';

import colors from '../../colors';

/** A picked image and its preview URL. */
export interface Screenshot {
  file: Blob;
  previewUrl: string;
}

interface ScreenshotPickerProps {
  screenshots: Screenshot[];
  max: number;
  onChange: (screenshots: Screenshot[]) => void;
}

/**
 * Thumbnails of the picked images and a button to add more, up to `max`. On a phone the button opens the
 * photo library, where the screenshots are. Web only: the iOS and Android apps will need an image picker here.
 */
export function ScreenshotPicker({ screenshots, max, onChange }: ScreenshotPickerProps) {
  const input = useRef<HTMLInputElement>(null);
  // The preview URLs hold the images in memory until they are revoked.
  const latest = useRef(screenshots);
  useEffect(() => {
    latest.current = screenshots;
  });
  useEffect(() => () => latest.current.forEach((s) => URL.revokeObjectURL(s.previewUrl)), []);

  function add(files: FileList | null) {
    const picked = Array.from(files ?? [])
      .slice(0, max - screenshots.length)
      .map((file) => ({ file, previewUrl: URL.createObjectURL(file) }));
    onChange([...screenshots, ...picked]);
  }

  function remove(screenshot: Screenshot) {
    URL.revokeObjectURL(screenshot.previewUrl);
    onChange(screenshots.filter((s) => s !== screenshot));
  }

  return (
    <View className="flex-row gap-2">
      {screenshots.map((screenshot, i) => (
        <View key={screenshot.previewUrl} className="h-24 w-14">
          <Image
            accessibilityLabel={`Screenshot ${i + 1}`}
            source={{ uri: screenshot.previewUrl }}
            resizeMode="cover"
            className="size-full rounded-lg bg-card-2"
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Remove screenshot ${i + 1}`}
            onPress={() => remove(screenshot)}
            className="absolute -right-2 -top-2 size-6 items-center justify-center rounded-full bg-ink"
          >
            <X color="#fff" size={14} />
          </Pressable>
        </View>
      ))}
      {screenshots.length < max && (
        <Pressable
          accessibilityRole="button"
          onPress={() => input.current?.click()}
          className="h-24 flex-1 items-center justify-center gap-1 rounded-lg border border-dashed border-grid bg-card"
        >
          <ImagePlus color={colors.text} size={22} />
          <Text className="text-sm text-text">Add screenshot</Text>
        </Pressable>
      )}
      <input
        ref={input}
        type="file"
        accept="image/*"
        multiple
        hidden
        aria-label="Screenshot files"
        onChange={(event) => {
          add(event.target.files);
          event.target.value = '';
        }}
      />
    </View>
  );
}
