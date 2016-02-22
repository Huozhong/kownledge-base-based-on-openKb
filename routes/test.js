var array = [
	{"catName": "first1", "id": "001", "isRoot": true, "isSecondary": false, "isChild": false},
	{"catName": "first2", "id": "002", "isRoot": true, "isSecondary": false, "isChild": false},
	{"catName": "first3", "id": "003", "isRoot": true, "isSecondary": false, "isChild": false},
	{"catName": "second1_1", "id": "004", "isRoot": false, "isSecondary": true, "isChild": false, "parent_id": "001"},
	{"catName": "second1_2", "id": "005", "isRoot": false, "isSecondary": true, "isChild": false, "parent_id": "001"},
	{"catName": "second2_1", "id": "006", "isRoot": false, "isSecondary": true, "isChild": false, "parent_id": "002"},
	{"catName": "second2_2", "id": "007", "isRoot": false, "isSecondary": true, "isChild": false, "parent_id": "002"},
	{"catName": "second3_1", "id": "008", "isRoot": false, "isSecondary": true, "isChild": false, "parent_id": "003"},
	{"catName": "second1_1_1", "id": "009", "isRoot": false, "isSecondary": false, "isChild": true, "parent_id": "004"},
	{"catName": "second1_2_1", "id": "010", "isRoot": false, "isSecondary": false, "isChild": true, "parent_id": "005"},
	{"catName": "second1_2_2", "id": "011", "isRoot": false, "isSecondary": false, "isChild": true, "parent_id": "005"}
];

var firstFatherCats = [], secondaryCats = [], threeCats = [], results = [];

for (var i = 0; i < array.length; i++) {
    var result = array[i];
    var obj1 = {}, obj2={},obj3={},resultObj={};
    if (result.isRoot) {// 得到一级类别
    	obj1.name = result.catName;
    	obj1.id = result.id;
        firstFatherCats.push(obj1);

        resultObj.text = result.catName;
        resultObj.id = result.id;
        resultObj.nodes = [];
        results.push(resultObj);
    }else if(result.isSecondary){// 得到二级类别
    	obj2.name = result.catName;
    	obj2.id = result.id;
    	obj2.parent_id = result.parent_id;
        secondaryCats.push(obj2);
    }else{// 得到三级类别
    	obj3.name = result.catName;
    	obj3.id = result.id;
    	obj3.parent_id = result.parent_id;
        threeCats.push(obj3);
    }
};
// console.log(threeCats);
// var secondResult = 
// 将二级分类放入一级分类中
for (var i = 0; i < secondaryCats.length; i++) {
    var secondaryCat = secondaryCats[i];
    for (var j = 0; j < firstFatherCats.length; j++) {
        var firstFatherCat = firstFatherCats[j];
        if(secondaryCat.parent_id == firstFatherCat.id){
            results[j].nodes.push({
                text: secondaryCat.name,
                id: secondaryCat.id,
                nodes: []
            });
        }
    };
};
// 将三级分类放入二级分类中
for (var i = 0; i < threeCats.length; i++) {
	for (var j = 0; j < results.length; j++) {
		for (var k = 0; k < results[j].nodes.length; k++) {
			if(threeCats[i].parent_id == results[j].nodes[k].id){
				results[j].nodes[k].nodes.push({
					text: secondaryCat.name,
					id: secondaryCat.id
				});
			}
		};
	};
};
console.log(results);