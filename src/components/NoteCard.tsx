import { NoteListItem } from '@/types/note';
import { Link } from '@cher1shrxd/loading';

interface NoteCardProps {
  note: NoteListItem;
}

export default function NoteCard({ note }: NoteCardProps) {
  return (
    <Link href={`/notes/${note.id}`}>
      <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
        {note.thumbnail_url && (
          <img
            src={`${process.env.NEXT_PUBLIC_API_BASE_URL}${note.thumbnail_url}`}
            alt="Note thumbnail"
            className="w-full h-48 object-cover"
          />
        )}
        <div className="p-4">
          <p className="text-gray-600 text-sm mb-2">
            {new Date(note.created_at).toLocaleDateString('ko-KR')}
          </p>
          {note.description && (
            <p className="text-gray-800 line-clamp-3">{note.description}</p>
          )}
          {note.concepts && note.concepts.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {note.concepts.slice(0, 3).map((concept, index) => (
                <span
                  key={index}
                  className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded"
                >
                  {concept.name}
                </span>
              ))}
              {note.concepts.length > 3 && (
                <span className="text-gray-500 text-xs px-2 py-1">
                  +{note.concepts.length - 3}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}