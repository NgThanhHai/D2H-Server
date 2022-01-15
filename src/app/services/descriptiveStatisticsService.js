const average_score = (scoreCollection) => {
    let totalItems = scoreCollection.length;
    let sumScore = 0
    for(var i = 0; i< totalItems; i++) {
        sumScore += scoreCollection[i]
    }
    
    return sumScore / totalItems;
}

const median_score = (scoreCollection) => {
    if(scoreCollection.length ===0) return 0;
 
    scoreCollection.sort(function(a,b){
      return a-b;
    });
   
    var half = Math.floor(scoreCollection.length / 2);
   
    if (scoreCollection.length % 2)
      return scoreCollection[half];
   
    return (scoreCollection[half - 1] + scoreCollection[half]) / 2.0;
}

const count_under_marked_score = (scoreCollection, pivot) => {
    let totalItems = scoreCollection.length;
    let count = 0
    for(var i = 0; i< totalItems; i++) {
        if(scoreCollection[i] < pivot)
        {
            count++
        }
    }
    
    return count;
}

const count_archive_marked_score = (scoreCollection, pivot) => {
    let totalItems = scoreCollection.length;
    let count = 0
    for(var i = 0; i< totalItems; i++) {
        if(scoreCollection[i] === pivot)
        {
            count++
        }
    }
    
    return count;
}

const highest_score_archived = arr => (arr || []).reduce( ( acc, el ) => {
    acc.k[el] = acc.k[el] ? acc.k[el] + 1 : 1
    acc.max = acc.max ? acc.max < acc.k[el] ? el : acc.max : el
    return acc  
  }, { k:{} }).max

module.exports = {average_score, median_score, count_under_marked_score, count_archive_marked_score, highest_score_archived}