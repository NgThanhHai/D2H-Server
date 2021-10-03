exports.successResponse = (res, msg) =>{
    var data = {
        success : true,
        message: msg
    };

    res.status(200).json(data)
};

exports.successResponseWithData = (res, msg, data) =>{
    var resData = {
        success : true,
        message: msg,
        data: data
    };

    res.status(200).json(resData)
};

exports.ErrorResponse = function (res, msg) {
	var data = {
		success: false,
		message: msg,
	};
	return res.status(500).json(data);
};

exports.notFoundResponse = function (res, msg) {
	var data = {
		success: false,
		message: msg,
	};
	return res.status(404).json(data);
};

exports.validationErrorWithData = function (res, msg, data) {
	var resData = {
		success: false,
		message: msg,
		data: data
	};
	return res.status(400).json(resData);
};

exports.unauthorizedResponse = function (res, msg) {
	var data = {
		success: false,
		message: msg,
	};
	return res.status(401).json(data);
};

exports.forbiddenResponse = function (res){
	var data = {
		success: false,
		message: "You don't have permisstion to access",
	}
	return res.status(403).json(data)
}

exports.badRequestResponse = function(res, msg){
	var data = {
		success: false,
		message: msg,
	};
	return res.status(400).json(data)
};

exports.conflictResponse = function(res, msg){
	var data = {
		success: false,
		message: msg
	};
	return res.status(409).json(data)
}