interface MountainNameProps {
  nameJa: string;
  done: boolean;
}

export default function MountainName({ nameJa, done }: MountainNameProps) {
  return (
    <div 
      className={`mountain-name ${done ? 'completed' : 'not-completed'}`}
      style={{
        color: done ? '#16a34a' : '#6b7280',
        fontWeight: done ? 'bold' : 'normal',
        textDecoration: done ? 'line-through' : 'none',
        fontSize: '1.125rem',
        transition: 'all 0.2s ease'
      }}
    >
      {nameJa}
    </div>
  );
}



