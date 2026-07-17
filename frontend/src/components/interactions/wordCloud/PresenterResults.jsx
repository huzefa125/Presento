import WordCloudVisualization from './Visualization';

const WordCloudPresenterResults = ({ wordFrequencies = {}, maxWords, width, height }) => {
  return (
    <div>
      <WordCloudVisualization
        wordFrequencies={wordFrequencies}
        maxWords={maxWords}
        width={width}
        height={height}
      />
    </div>
  );
};

export default WordCloudPresenterResults;
