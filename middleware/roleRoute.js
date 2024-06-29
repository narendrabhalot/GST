const allowedRoles = {
    'register': [],
    'send-otp': ['user'],
    'verify-otp': ['user'],
    'userBill': ['user'],
    'user-update-plan': ['user'],
    'getBill': ['user'],
    'upload-image': ['user'],
    'images': ['user'],
    'imageDate': ['user'],
    'loan': ['user'],
    'reconciliation': ['user'],
    'plan-subplan': ['user'],
    'plan-id': ['user'],
    'myPlan': ['user'],
    'deletePlan': [],
    'billHistory': ['user'],
    'imageHistory': ['user'],
    'updateBillHistory': ['user'],
    'filling': ['user'],
    'composite': ['user'],
    'users': ['admin'],
    'user-update': ['admin'],
    'admin': ['admin'],
    'adminLogIn': [],
    'upload-excel': ['admin'],
    'upload-b2bexcel': ['admin'],
    'upload-b2baexcel': ['admin'],
    'create-reconciliation': ['admin'],
    'plan': ['admin'],
    'subPlan': ['admin'],
    'updateSubPlan': ['admin'],
};

function getAllowedRoles(routePath) {
    routePath = routePath.split('/')
    return allowedRoles[routePath[1]] || [];
}

module.exports = getAllowedRoles;
