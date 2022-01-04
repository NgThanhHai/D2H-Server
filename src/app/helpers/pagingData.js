const getPagingData = ( page) => {
    const currentPage = page ? +page : 0;
  
    return currentPage;
  };

  module.exports = getPagingData;