interface ProgressCounterProps {
  completedCount: number;
}

export default function ProgressCounter({ completedCount }: ProgressCounterProps) {
  return (
    <div 
      className="progress-counter"
      style={{
        fontSize: '1.5rem',
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: '1.5rem',
        color: '#171717'
      }}
    >
      {completedCount}/100
    </div>
  );
}



