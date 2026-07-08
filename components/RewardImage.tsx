interface RewardImageProps {
  src: string;
}

/** Static reward image, sized to sit as a corner card inside the camera zone. */
export function RewardImage({ src }: RewardImageProps) {
  return (
    <img
      src={src}
      alt="Salute confirmed"
      className="max-h-[60vh] w-full rounded-lg border-2 border-white/80 object-contain shadow-2xl"
    />
  );
}
