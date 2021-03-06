
const memorize = (func) => {
    const results = {};
    return (...args) => {
        const argsKey = JSON.stringify(args);
        if (!results[argsKey]) {
            results[argsKey] = func(...args);
        }
        return results[argsKey];
    };
};

const countMatchPercentage = (obj) => {
    var numberOfKey = Object.keys(obj).length;
    var count = 0; 
    Object.keys(obj).forEach(key => {               
      if(typeof obj[key] === 'object')
      {
        if(countMatchPercentage(obj[key]) == 1)   
        {
          count++
        }
      }else{
        if(obj[key] == "True")
        {
          count++;
        }
      }
    })
    return count/numberOfKey
}


const diff = memorize((obj1, obj2) => {
    const result = {};
    obj2 = Object.keys(obj2).slice(0, Object.keys(obj1).length).reduce((result, key) => {
        result[key] = obj2[key];
    
        return result;
    }, {});
    if (Object.is(obj1, obj2)) {
        return undefined;
    }
    if (!obj2 || typeof obj2 !== 'object') {
        return obj2;
    }
    
    Object.keys(obj1 || {}).concat(Object.keys(obj2 || {})).forEach(key => {

        // if (obj2[key] !== obj1[key] && !Object.is(obj1[key], obj2[key])) {
        //     result[key] = "False";
        // } else {
        //     result[key] = "True";

        // }
        // if (typeof obj2[key] === 'object' && typeof obj1[key] === 'object') {
        //     const value = diff(obj1[key], obj2[key]);
        //     if (value !== undefined) {
        //         result[key] = value;
        //     }
        // }
        let arrayResult = []
        if(obj2[key].length > obj1[key].length) {
            for(let index = 0; index < obj1[key].length; index++)  {
            
            
                    arrayResult.push( "False")
                
            }
        }else {
            for(let index = 0; index < obj1[key].length; index++)  {
            
            
                if (obj2[key].includes(obj1[key][index]))
                {
                    arrayResult.push( "True")
                }else {
                    arrayResult.push( "False")
                }
            }
        }
        
        result[key] = arrayResult

    });

    return result;
});


module.exports = {memorize, countMatchPercentage, diff}

