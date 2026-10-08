import { Cloud, MessagesSquare, MapPin, Trophy, Type, Image, Video, BookOpen, FileText, Presentation, Monitor, GitCompare } from 'lucide-react';
import { useTranslation } from 'react-i18next';

/**
 * Per-slide-type thumbnail preview used by SlideBar's slide list. Split out
 * of SlideBar.jsx (where it was a 433-line inline render function called
 * renderSlidePreview) since it's a pure function of (slide, isHorizontal)
 * with no dependency on SlideBar's own state; see CODE_STANDARDS.md.
 */
export default function SlideThumbnailPreview({ slide, isHorizontal }) {
  const { t } = useTranslation();
  const question = slide?.question || '';
  // Adjust truncation based on layout
  const maxLength = isHorizontal ? 15 : 25;
  const truncatedQuestion = question.length > maxLength ? question.substring(0, maxLength) + '...' : question;

  switch (slide?.type) {
      case 'multiple_choice': {
        const options = slide?.options || [];
        return (
          <div className="w-full h-full p-1.5 flex flex-col gap-1 bg-canvas-soft">
            <div className="text-[6px] sm:text-[7px] font-semibold text-ink text-center leading-tight line-clamp-1">
              {truncatedQuestion || t('slide_types.multiple_choice')}
            </div>
            <div className="flex-1 flex flex-col gap-0.5 justify-center">
              {options.slice(0, 3).map((opt, idx) => (
                <div key={opt.id || opt.text || `mc-opt-${idx}`} className="h-1.5 bg-ink/10 rounded-sm flex items-center px-1">
                  <div className="h-0.5 bg-accent-green rounded-sm" style={{ width: `${(idx + 1) * 30}%` }}></div>
                </div>
              ))}
              {options.length === 0 && (
                <div className="text-[5px] text-ink-muted text-center">{t('slide_editors.pick_answer.add_options')}</div>
              )}
            </div>
          </div>
        );
      }

      case 'quiz': {
        const quizOptions = slide?.quizSettings?.options || [];
        const correctOptionId = slide?.quizSettings?.correctOptionId;
        return (
          <div className="w-full h-full p-1.5 flex flex-col gap-1 bg-canvas-soft">
            <div className="flex items-center justify-between">
              <span className="text-[5px] text-accent-green font-bold">QUIZ</span>
              <span className="text-[5px] text-ink-muted">{slide?.quizSettings?.timeLimit || 30}s</span>
            </div>
            <div className="text-[6px] sm:text-[7px] font-semibold text-ink text-center leading-tight line-clamp-1">
              {truncatedQuestion || t('slide_editors.quiz.default_title')}
            </div>
            <div className="flex-1 flex flex-col gap-0.5 justify-center">
              {quizOptions.slice(0, 2).map((opt, idx) => {
                const isCorrect = opt.id === correctOptionId;
                return (
                  <div key={opt.id || idx} className={`h-1.5 rounded-sm px-1 flex items-center ${isCorrect ? 'bg-accent-green/10 border-l border-accent-green' : 'bg-ink/10'}`}>
                    <span className="text-[5px] text-ink line-clamp-1">{opt.text || t('slide_editors.quiz.option_placeholder', { number: idx + 1 })}</span>
                  </div>
                );
              })}
              {quizOptions.length === 0 && (
                <div className="text-[5px] text-ink-muted text-center">{t('slide_editors.pick_answer.add_options')}</div>
              )}
            </div>
          </div>
        );
      }

      case 'word_cloud':
        return (
          <div className="w-full h-full p-1.5 flex flex-col gap-1 bg-canvas-soft">
            <div className="text-[6px] sm:text-[7px] font-semibold text-ink text-center leading-tight line-clamp-1">
              {truncatedQuestion || t('slide_editors.word_cloud.default_title')}
            </div>
            <div className="flex-1 flex items-center justify-center">
              <div className="flex flex-wrap gap-0.5 items-center justify-center">
                <Cloud className="h-4 w-4 text-accent-green" />
              </div>
            </div>
          </div>
        );

      case 'open_ended':
        return (
          <div className="w-full h-full p-1.5 flex flex-col gap-1 bg-canvas-soft">
            <div className="text-[6px] sm:text-[7px] font-semibold text-ink text-center leading-tight line-clamp-1">
              {truncatedQuestion || t('slide_editors.open_ended.default_title')}
            </div>
            <div className="flex-1 flex items-center justify-center">
              <div className="w-full h-4 border border-dashed border-ink-faint rounded-sm bg-surface flex items-center justify-center">
                <span className="text-[5px] text-ink-muted">{t('slide_editors.open_ended.responses')}</span>
              </div>
            </div>
          </div>
        );

      case 'scales': {
        const statements = slide?.statements || [];
        return (
          <div className="w-full h-full p-1.5 flex flex-col gap-1 bg-canvas-soft">
            <div className="text-[6px] sm:text-[7px] font-semibold text-ink text-center leading-tight line-clamp-1">
              {truncatedQuestion || t('slide_editors.scales.default_title')}
            </div>
            <div className="flex-1 flex flex-col gap-0.5 justify-center">
              {statements.slice(0, 2).map((stmt, idx) => (
                <div key={stmt.id || stmt.text || `stmt-${idx}`} className="flex items-center gap-1">
                  <div className="w-1 h-1 rounded-full bg-accent-green flex-shrink-0"></div>
                  <div className="flex-1 h-0.5 bg-ink/10 rounded-sm"></div>
                </div>
              ))}
              {statements.length === 0 && (
                <div className="text-[5px] text-ink-muted text-center">{t('slide_editors.scales.add_statements')}</div>
              )}
            </div>
          </div>
        );
      }

      case 'ranking': {
        const rankingItems = slide?.rankingItems || [];
        return (
          <div className="w-full h-full p-1.5 flex flex-col gap-1 bg-canvas-soft">
            <div className="text-[6px] sm:text-[7px] font-semibold text-ink text-center leading-tight line-clamp-1">
              {truncatedQuestion || t('slide_editors.ranking.default_title')}
            </div>
            <div className="flex-1 flex flex-col gap-0.5 justify-center">
              {rankingItems.slice(0, 3).map((item, idx) => (
                <div key={item.id || idx} className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-sm bg-accent-green flex items-center justify-center flex-shrink-0">
                    <span className="text-[4px] text-on-primary font-bold">{idx + 1}</span>
                  </div>
                  <div className="flex-1 h-1 bg-ink/10 rounded-sm"></div>
                </div>
              ))}
              {rankingItems.length === 0 && (
                <div className="text-[5px] text-ink-muted text-center">{t('slide_editors.ranking.add_items')}</div>
              )}
            </div>
          </div>
        );
      }

      case 'hundred_points': {
        const hundredPointsItems = slide?.hundredPointsItems || [];
        return (
          <div className="w-full h-full p-1.5 flex flex-col gap-1 bg-canvas-soft">
            <div className="text-[6px] sm:text-[7px] font-semibold text-ink text-center leading-tight line-clamp-1">
              {truncatedQuestion || t('slide_editors.hundred_points.default_title')}
            </div>
            <div className="flex-1 flex flex-col gap-0.5 justify-center">
              {hundredPointsItems.slice(0, 2).map((item, idx) => (
                <div key={item.id || idx} className="flex items-center justify-between gap-1">
                  <div className="flex-1 h-1 bg-ink/10 rounded-sm"></div>
                  <span className="text-[5px] text-accent-green font-bold">0</span>
                </div>
              ))}
              {hundredPointsItems.length === 0 && (
                <div className="text-[5px] text-ink-muted text-center">{t('slide_editors.hundred_points.add_items')}</div>
              )}
            </div>
          </div>
        );
      }

      case '2x2_grid': {
        const gridItems = slide?.gridItems || [];
        return (
          <div className="w-full h-full p-1.5 flex flex-col gap-1 bg-canvas-soft">
            <div className="text-[6px] sm:text-[7px] font-semibold text-ink text-center leading-tight line-clamp-1">
              {truncatedQuestion || t('slide_editors.two_by_two_grid.default_title')}
            </div>
            <div className="flex-1 flex items-center justify-center">
              <div className="w-8 h-8 grid grid-cols-2 grid-rows-2 gap-px border border-hairline rounded-sm bg-hairline">
                {[0, 1, 2, 3].map((idx) => (
                  <div key={idx} className="bg-surface flex items-center justify-center">
                    {gridItems[idx] && (
                      <div className="w-1 h-1 rounded-full bg-accent-green"></div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      }

      case 'pin_on_image': {
        const imageUrl = slide?.pinOnImageSettings?.imageUrl;
        return (
          <div className="w-full h-full p-1.5 flex flex-col gap-1 bg-canvas-soft">
            <div className="text-[6px] sm:text-[7px] font-semibold text-ink text-center leading-tight line-clamp-1">
              {truncatedQuestion || t('slide_editors.pin_on_image.default_title')}
            </div>
            <div className="flex-1 flex items-center justify-center relative bg-surface rounded-sm border border-hairline overflow-hidden">
              {imageUrl ? (
                <img src={imageUrl} alt="" className="w-full h-full object-cover opacity-60" />
              ) : (
                <MapPin className="h-3 w-3 text-ink-faint" />
              )}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <div className="w-1 h-1 bg-accent-green rounded-full"></div>
              </div>
            </div>
          </div>
        );
      }

      case 'qna':
        return (
          <div className="w-full h-full p-1.5 flex flex-col gap-1 bg-canvas-soft">
            <div className="text-[6px] sm:text-[7px] font-semibold text-ink text-center leading-tight line-clamp-1">
              {truncatedQuestion || t('slide_editors.qna.default_title')}
            </div>
            <div className="flex-1 flex items-center justify-center">
              <div className="w-full h-4 border border-dashed border-ink-faint rounded-sm bg-surface flex items-center justify-center">
                <MessagesSquare className="h-2 w-2 text-accent-green" />
              </div>
            </div>
          </div>
        );

      case 'leaderboard':
        return (
          <div className="w-full h-full p-1.5 flex flex-col gap-1 bg-canvas-soft">
            <div className="flex items-center justify-center gap-0.5">
              <Trophy className="h-2 w-2 text-accent-orange" />
              <span className="text-[5px] text-accent-orange font-bold">LEADERBOARD</span>
            </div>
            <div className="flex-1 flex flex-col gap-0.5 justify-center">
              {[0, 1, 2].map((idx) => (
                <div key={idx} className="flex items-center gap-1">
                  <div className={`w-1.5 h-1.5 rounded-full flex items-center justify-center flex-shrink-0 ${
                    idx === 0 ? 'bg-accent-orange' : idx === 1 ? 'bg-ink-faint' : 'bg-accent-brown'
                  }`}>
                    <span className="text-[4px] text-on-primary font-bold">{idx + 1}</span>
                  </div>
                  <div className="flex-1 h-1 bg-ink/10 rounded-sm"></div>
                  <span className="text-[5px] text-accent-green font-bold">0</span>
                </div>
              ))}
            </div>
          </div>
        );

      case 'guess_number':
        return (
          <div className="w-full h-full p-1.5 flex flex-col gap-1 bg-canvas-soft">
            <div className="text-[6px] sm:text-[7px] font-semibold text-ink text-center leading-tight line-clamp-1">
              {truncatedQuestion || t('slide_editors.guess_number.default_title')}
            </div>
            <div className="flex-1 flex items-center justify-center">
              <div className="text-[10px] font-bold text-accent-green">?</div>
            </div>
          </div>
        );

      // Present Your Content section
      case 'text':
        return (
          <div className="w-full h-full p-1.5 flex flex-col gap-1 bg-canvas-soft">
            <div className="text-[6px] sm:text-[7px] font-semibold text-ink text-center leading-tight line-clamp-1">
              {truncatedQuestion || t('slide_editors.text.default_title')}
            </div>
            <div className="flex-1 flex items-center justify-center bg-surface rounded-sm border border-hairline">
              <Type className="h-3 w-3 text-accent-sky" />
            </div>
          </div>
        );

      case 'image':
        return (
          <div className="w-full h-full p-1.5 flex flex-col gap-1 bg-canvas-soft">
            <div className="text-[6px] sm:text-[7px] font-semibold text-ink text-center leading-tight line-clamp-1">
              {truncatedQuestion || t('slide_editors.image.default_title')}
            </div>
            <div className="flex-1 flex items-center justify-center bg-surface rounded-sm border border-hairline">
              <Image className="h-3 w-3 text-accent-green" />
            </div>
          </div>
        );

      case 'video':
        return (
          <div className="w-full h-full p-1.5 flex flex-col gap-1 bg-canvas-soft">
            <div className="text-[6px] sm:text-[7px] font-semibold text-ink text-center leading-tight line-clamp-1">
              {truncatedQuestion || t('slide_editors.video.default_title')}
            </div>
            <div className="flex-1 flex items-center justify-center bg-surface rounded-sm border border-hairline">
              <Video className="h-3 w-3 text-accent-pink" />
            </div>
          </div>
        );

      case 'instruction':
        return (
          <div className="w-full h-full p-1.5 flex flex-col gap-1 bg-canvas-soft">
            <div className="text-[6px] sm:text-[7px] font-semibold text-ink text-center leading-tight line-clamp-1">
              {truncatedQuestion || t('slide_editors.instruction.default_title')}
            </div>
            <div className="flex-1 flex items-center justify-center bg-surface rounded-sm border border-hairline">
              <BookOpen className="h-3 w-3 text-accent-purple-deep" />
            </div>
          </div>
        );

      // Challenge Mode section
      case 'pick_answer': {
        const options = slide?.options || [];
        return (
          <div className="w-full h-full p-1.5 flex flex-col gap-1 bg-canvas-soft">
            <div className="text-[6px] sm:text-[7px] font-semibold text-ink text-center leading-tight line-clamp-1">
              {truncatedQuestion || t('slide_editors.pick_answer.pick_the_answer')}
            </div>
            <div className="flex-1 flex flex-col gap-0.5 justify-center">
              {options.slice(0, 3).map((opt, idx) => (
                <div key={opt.id || opt.text || `pick-opt-${idx}`} className="h-1.5 bg-ink/10 rounded-sm flex items-center px-1">
                  <div className="h-0.5 bg-accent-green rounded-sm" style={{ width: `${(idx + 1) * 30}%` }}></div>
                </div>
              ))}
              {options.length === 0 && (
                <div className="text-[5px] text-ink-muted text-center">{t('slide_editors.pick_answer.add_options')}</div>
              )}
            </div>
          </div>
        );
      }

      case 'type_answer':
        return (
          <div className="w-full h-full p-1.5 flex flex-col gap-1 bg-canvas-soft">
            <div className="text-[6px] sm:text-[7px] font-semibold text-ink text-center leading-tight line-clamp-1">
              {truncatedQuestion || t('slide_editors.type_answer.default_title')}
            </div>
            <div className="flex-1 flex items-center justify-center">
              <div className="w-full h-4 border border-dashed border-ink-faint rounded-sm bg-surface flex items-center justify-center">
                <span className="text-[5px] text-ink-muted">{t('slide_editors.type_answer.participant_prompt')}</span>
              </div>
            </div>
          </div>
        );

      // Bring Your Slides In section
      case 'miro':
        return (
          <div className="w-full h-full p-1.5 flex flex-col gap-1 bg-canvas-soft">
            <div className="text-[6px] sm:text-[7px] font-semibold text-ink text-center leading-tight line-clamp-1">
              {truncatedQuestion || t('slide_editors.miro.default_title')}
            </div>
            <div className="flex-1 flex items-center justify-center bg-surface rounded-sm border border-hairline">
              <FileText className="h-3 w-3 text-accent-teal" />
            </div>
          </div>
        );

      case 'powerpoint':
        return (
          <div className="w-full h-full p-1.5 flex flex-col gap-1 bg-canvas-soft">
            <div className="text-[6px] sm:text-[7px] font-semibold text-ink text-center leading-tight line-clamp-1">
              {truncatedQuestion || t('slide_editors.powerpoint.default_title')}
            </div>
            <div className="flex-1 flex items-center justify-center bg-surface rounded-sm border border-hairline">
              <Presentation className="h-3 w-3 text-accent-orange-deep" />
            </div>
          </div>
        );

      case 'google_slides':
        return (
          <div className="w-full h-full p-1.5 flex flex-col gap-1 bg-canvas-soft">
            <div className="text-[6px] sm:text-[7px] font-semibold text-ink text-center leading-tight line-clamp-1">
              {truncatedQuestion || t('slide_editors.google_slides.default_title')}
            </div>
            <div className="flex-1 flex items-center justify-center bg-surface rounded-sm border border-hairline">
              <Monitor className="h-3 w-3 text-accent-sky" />
            </div>
          </div>
        );

      case 'pdf': {
        const pdfPages = slide?.pdfPages || [];
        return (
          <div className="w-full h-full p-1.5 flex flex-col gap-1 bg-canvas-soft">
            <div className="text-[6px] sm:text-[7px] font-semibold text-ink text-center leading-tight line-clamp-1">
              {truncatedQuestion || t('slide_editors.pdf.pdf_slide')}
            </div>
            <div className="flex-1 flex items-center justify-center bg-surface rounded-sm border border-hairline overflow-hidden relative">
              {pdfPages.length > 0 && pdfPages[0]?.imageUrl ? (
                <img
                  src={pdfPages[0].imageUrl}
                  alt="PDF preview"
                  className="w-full h-full object-contain opacity-80"
                />
              ) : (
                <FileText className="h-3 w-3 text-accent-pink" />
              )}
              {pdfPages.length > 1 && (
                <div className="absolute bottom-0 right-0 bg-ink/70 text-[5px] text-on-primary px-1 py-0.5 rounded-tl">
                  +{pdfPages.length - 1}
                </div>
              )}
            </div>
          </div>
        );
      }

      case 'compare_slides': {
        const optionA = slide?.compareSettings?.optionA;
        const optionB = slide?.compareSettings?.optionB;
        return (
          <div className="w-full h-full p-1.5 flex flex-col gap-1 bg-canvas-soft">
            <div className="text-[6px] sm:text-[7px] font-semibold text-ink text-center leading-tight line-clamp-1">
              {truncatedQuestion || t('slide_editors.compare_slides.question_placeholder')}
            </div>
            <div className="flex-1 flex items-center justify-center gap-0.5">
              <div className="flex-1 h-full bg-surface rounded-sm border border-hairline overflow-hidden">
                {optionA?.contentType === 'image' && optionA?.imageUrl ? (
                  <img src={optionA.imageUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <GitCompare className="h-2.5 w-2.5 text-ink-faint" />
                  </div>
                )}
              </div>
              <div className="flex-1 h-full bg-surface rounded-sm border border-hairline overflow-hidden">
                {optionB?.contentType === 'image' && optionB?.imageUrl ? (
                  <img src={optionB.imageUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <GitCompare className="h-2.5 w-2.5 text-ink-faint" />
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      }

      default:
        return (
          <div className="w-full h-full flex items-center justify-center bg-canvas-soft">
            <div className="text-[6px] text-ink-muted text-center">{truncatedQuestion || 'Slide'}</div>
          </div>
        );
  }
}
