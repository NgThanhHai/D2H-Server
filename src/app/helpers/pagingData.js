const getPagingData = ( page) => {
    const currentPage = page ? + page : 1;
  
    return currentPage;
  };

  module.exports = getPagingData;