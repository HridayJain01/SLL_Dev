import {
  BookOpen,
  Puzzle,
  GraduationCap,
  RefreshCcw,
} from 'lucide-react';

export default function About() {
  return (
    <section
      className="overflow-hidden py-24"
      style={{ backgroundColor: '#FFFFFF' }}
    >
      <div className="mx-auto max-w-[1200px] px-6">
        {/* Heading */}
        <h2 className="text-center font-heading text-[56px] font-black text-[#25302B]">
          About Us
        </h2>

        {/* Content */}
        <div className="mx-auto mt-16 max-w-[820px] text-center">
          <p className="text-[30px] font-bold leading-[1.45] text-[#23223A]">
            At Star Learners,
            <br />
            we curate{' '}
            <span className="text-[#FF4F8D]">
              thoughtful books and puzzles
            </span>
            <br />
            that grow with your child.
          </p>

          <p className="mt-12 text-[30px] font-bold leading-[1.45] text-[#23223A]">
            <span className="text-[#F9732A]">
              Doorstep delivery,
            </span>{' '}
            age-appropriate selections,
            <br />
            and{' '}
            <span className="text-[#6674FF]">
              easy monthly exchanges
            </span>{' '}
            make
            <br />
            reading simple for families.
          </p>
        </div>

        {/* Features */}
        <div className="mx-auto mt-28 grid max-w-[950px] grid-cols-2 gap-y-12 md:grid-cols-4">
          <div className="text-center">
            <BookOpen
              className="mx-auto mb-4 h-9 w-9"
              color="#6D63FF"
              strokeWidth={2}
            />
            <p className="text-[22px] font-bold text-[#2D2D44]">
              400+
            </p>
            <p className="mt-1 text-[17px] text-[#555]">
              curated books
            </p>
          </div>

          <div className="text-center">
            <Puzzle
              className="mx-auto mb-4 h-9 w-9"
              color="#26B4B4"
              strokeWidth={2}
            />
            <p className="text-[22px] font-bold text-[#2D2D44]">
              150+
            </p>
            <p className="mt-1 text-[17px] text-[#555]">
              puzzles
            </p>
          </div>

          <div className="text-center">
            <GraduationCap
              className="mx-auto mb-4 h-9 w-9"
              color="#0DA3E5"
              strokeWidth={2}
            />
            <p className="text-[17px] font-semibold text-[#2D2D44]">
              Age based learning
            </p>
          </div>

          <div className="text-center">
            <RefreshCcw
              className="mx-auto mb-4 h-9 w-9"
              color="#FF6D61"
              strokeWidth={2}
            />
            <p className="text-[17px] font-semibold text-[#2D2D44]">
              Simple monthly exchange
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}