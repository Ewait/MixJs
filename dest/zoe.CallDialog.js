(function($){
	var _SERVICE_URL = 'http://localhost:8080/webservice/rest/queue/call';
	//var _SERVICE_URL = 'http://192.168.2.35:8888/webservice/rest/queue/call';
	var _html = 
		'<div id="zoeSimpleDialog" class="zoe-simple-model">' +
			'<div class="model">' + 
				'<a href="javascript:void(0);" class="close-btn"></a>' +
				'<a href="javascript:void(0);" class="arrR-btn">叫号窗口</a>' +
			'</div>' +
		'</div>' +
		'<div id="zoeCallDialog" class="zoe-call-dialog">' +
			  '<div class="windows">' +
				  '<div class="top-bar">' +
				    '<span class="title">叫号窗口</span>' +
				    '<span class="present-num">当前号：<a id="callingQueueNo"></></span>' +
				    '<span class="next-num">下一号：<a id="nextQueueNo"></></span>' +
				    '<a href="javascript:void(0);" class="arrL-btn"></a>' +
				    '<span class="col-text" id="showQueueNoListToggle">队列</span>' +
				  '</div>' +
				  '<div class="main-box" id="list">' +
				    '<div class="tab-item">' +
				      '<ul>' +
				        '<li class="select" id="queueModel_Ordinary">普通门诊</li>' +
				        '<li id="queueModel_Specialist">专家门诊</li>' +
				      '</ul>' +
					  /*'<input name="" id="cbQueueNoStatus" type="text" />' +*/
					  '<select id="cbQueueNoStatus">' +
					  	'<option value="1">等待中</option>' +
					  	'<option value="3">已呼叫</option>' +
					  	'<option value="4">已跳过</option>' +
					  '</select>' +
				    '</div>' +
				    '<div class="grid">' +
				      '<div class="t-hd">' +
				        '<table width="100%" border="0" cellspacing="0" cellpadding="0">' +
				          '<tr>' +
				            '<td>序号</td>' +
				            '<td>排队号</td>' +
				            '<td>姓名</td>' +
				            '<td>操作</td>' +
				          '</tr>' +
				        '</table>' +
				      '</div>' +
				      '<div class="t-bd">' +
				        '<table id="tbQueueNoList" width="100%" border="0" cellspacing="0" cellpadding="0">' +
				        '</table>' +
				      '</div>' +
				    '</div>' +
				  '</div>' +
				  '<div class="bottom-line">' +
				    '<div class="block">' +
				      '<span><label>诊室：</label><input name="" id="cbRoom" type="text" /></span>' +
				      '<span id="radioQueueModel"><a href="javacript:void(0);" class="radio-icon radio-icon-check" data-value="2">普通</a><a href="javacript:void(0);" class="radio-icon" data-value="1">专家</a></span>' +
				      '<span><input type="button" class="btn" id="btnStart" data-status="-1" value="开&nbsp;诊"/></span>' +
				    '</div>' +
				    '<div class="block">' +
				      '<span>' +
				        '<input type="button" class="btn large-btn" id="btnCallAgain" value="重新呼叫"/>' +
				        '<input type="button" class="btn large-btn" id="btnCallNext" value="下一个"/>' +
				        '<input type="button" class="btn" id="btnSkipNumber" value="跳&nbsp;过"/>' +
				      '</span>' +
				      '<input type="button" id="evaluate" class="evaluate" value="评&nbsp;价" />' +
				    '</div>' +
				  '</div>' +
				'</div>' +
			'</div>';
	
	var _callDialog;
	var _roomComboBox;
	var _queueNoStatusComboBox;
	var _orgId;
	var _staffCode;
	var _currentQueueRecordId;

    //排号状态
    var _queueNoStatus = [
         { id: 1, text: '等待中' },
         { id: 3, text: '已呼叫'},
         { id: 4, text: '已跳过' }
    ];
    var _consultingRoomList;
	var _staffDutyRecord;
	var _lastStaffDutyRecord;
	var _callingQueueNo;
	var _ordinaryQueueRecordId;
	var _specialistQueueRecordId;
    	
	
	//评价功能
	var _evaluator;
	function evaluate(){
        var score = _evaluator.PJQSendData(3, 9600, 3, 0);
        if(score === -1){
        	$.zoeMessageBox.warn('请确认评价器是否能够正常工作！');
        	return;
        }
        $.ajax({
			type : 'GET',
			data : {
				orgId : _orgId,
				staffCode : _staffCode,
				score : score
			},
			url : _SERVICE_URL + '/evaluate',
			dataType : 'jsonp',
			jsonp : '_jsonp',
			jsonpCallback : 'callback',
			success : function(result) {
				if(result.isSuccess){
					$.zoeMessageBox.warn('评价完成！');
				}
				else{
					$.zoeMessageBox.warn('评价失败：' + result.errorMessage);
				}
			}
		});
	}
	
	function ZoeCallDialog(){
	}
	
	ZoeCallDialog.prototype = {
		init : function(orgId, staffCode){
			_staffCode = staffCode;
			_orgId = orgId;
			$("body").append(_html);
			
			//评价器初始化
	        objectInfo = "<object  type='application/x-itst-activex' clsid='{FD4C53FD-B426-42CA-9E5B-675E6E016C1A}' id='evaluator' style='height:0; width:0'></object>"
	        $("body").append(objectInfo);
	        _evaluator = document.getElementById("evaluator");
			
			
			//获取初始化数据
			$.ajax({
				type : 'GET',
				data : {
					orgId : _orgId,
					staffCode : _staffCode
				},
				url : _SERVICE_URL + '/init',
				dataType : 'jsonp',
				jsonp : '_jsonp',
				jsonpCallback : 'callback',
				success : function(result) {
					_consultingRoomList = result.data.consultingRoomList;
					_staffDutyRecord = result.data.staffDutyRecord;
					_lastStaffDutyRecord = result.data.lastStaffDutyRecord;
					_ordinaryQueueRecordId = result.data.ordinaryQueueRecordId;
					_specialistQueueRecordId = result.data.specialistQueueRecordId;
					if(_staffDutyRecord != undefined){
						_currentQueueRecordId = _staffDutyRecord.queueRecordId;
					}
					_callingQueueNo = result.data.callingQueueNo;
					_callDialog = $.zoeDialog.tip({
		       	 		width: 424,	 
		       	 		height:'auto',      	  	 
		       	  		target: $("#zoeCallDialog")
		   	 		});
		          
		            _queueNoStatusComboBox = $("#zoeCallDialog #cbQueueNoStatus").zoeComboBox({
		            	//data:_queueNoStatus,
		            	width:77,
		            	initValue : "1",
		            	onSelected: function(value){
		            		if(_staffDutyRecord){
		        				queryQueueNoList(value);
		            		}
		            	}
		            })
		            
				    //科室选择下拉框
		            _roomComboBox = $("#zoeCallDialog #cbRoom").zoeComboBox({ 
				        width: 134,
				        tree:{
				        	nodeWidth:108, //未包含节点前面的空白宽度
							data: _consultingRoomList,					
							checkbox:false,
							treeLine:false,
							parentIcon:false,					
							childIcon:false
						},
						clickEve:function(){
							//科室选择下拉框添加滚动条插件
							$('.l-box-select-inner').niceScroll({ zindex:99999, cursorcolor:'#bddeff',cursorwidth: '5px'});
						}
				    });
		            render();
					eventBind();
					setData();
				}
			});
		},
		close : function(){
        	$("#zoeSimpleDialog").remove();
        	$("#zoeCallDialog").remove();
        	_callDialog.close();
        	$(".l-box-select").remove();
		}
	}
	
	function setData(){
		if(_staffDutyRecord === null || _staffDutyRecord === undefined){
			$("#showQueueNoListToggle").hide();
			$("#btnCallAgain,#btnCallNext,#btnSkipNumber").addClass("forbid");
			$("#btnCallAgain,#btnCallNext,#btnSkipNumber").attr("disabled","disabled");
			
			if(_lastStaffDutyRecord != undefined){
				if(_roomComboBox.findTextByValue(_lastStaffDutyRecord.consultingRoomId) != ""){
					_roomComboBox.setValue(_lastStaffDutyRecord.consultingRoomId);
				}
			}
		}
		else{
			if(_staffDutyRecord.status === '-1'){
				$("#btnCallAgain,#btnCallNext,#btnSkipNumber").addClass("forbid");
				$("#btnCallAgain,#btnCallNext,#btnSkipNumber").attr("disabled","disabled");
			}
			//绑定当前队列记录ID
			_currentQueueRecordId = _staffDutyRecord.queueRecordId;
			//绑定当前叫号
			if(_callingQueueNo){
				$("#callingQueueNo").html(_callingQueueNo.queueNo);
			}
				//如果是预约号才显示下一个号
			if(_staffDutyRecord.isReservation === "1"){
				$(".next-num").show();
			}
			else{
				$(".next-num").hide();
			}
			//绑定诊室
			_roomComboBox.setValue(_staffDutyRecord.consultingRoomId);
			//绑定队列模式
			$("#radioQueueModel .radio-icon").removeClass("radio-icon-check");
			$("#radioQueueModel .radio-icon[data-value="+ _staffDutyRecord.queueModel +"]").addClass("radio-icon-check");
			$("#radioQueueModel").attr("disabled","disabled");
			//绑定开/停诊按钮状态
			var $btnStart = $("#zoeCallDialog #btnStart");
			if(_staffDutyRecord.status === "1"){
				$btnStart.attr("data-status","1");
				$btnStart.val("停 诊");
            	_roomComboBox.setDisabled(true);
			}
			else{
				$btnStart.attr("data-status","-1");
				$btnStart.val("开 诊");
            	_roomComboBox.setEnabled(true);
			}
			//绑定队列详细
			if(_ordinaryQueueRecordId != undefined){
				$("#queueModel_Ordinary").attr("data-queueRecordId",_ordinaryQueueRecordId);
			}
			else{
				$("#queueModel_Ordinary").attr("data-queueRecordId","");
			}
				//如果是专家队列
			if(_staffDutyRecord.queueModel === "1"){
				$("#queueModel_Ordinary").removeClass("select");
				$("#queueModel_Specialist").addClass("select");
				$("#queueModel_Specialist").attr("data-queueRecordId",_specialistQueueRecordId);
			}
			else{
				$("#queueModel_Specialist").remove();
			}
		}
	}
	
	function render(){
		gridStyle();
		radioBtn();
		showList();
	}
	
	function eventBind(){
		//大小窗口切换
        $(".arrL-btn").click(function() {
        	_callDialog.hide();
        	$("#zoeSimpleDialog").show();
        });
        $(".arrR-btn").click(function() {	        	
        	$("#zoeSimpleDialog").hide();
        	_callDialog.show();
        });

        //关闭小窗口
        $(".close-btn").click(function() {
        	$("#zoeSimpleDialog").remove();
        	$("#zoeCallDialog").remove();
        	//ZoeCallDialog = null;
        });
        
        $("#zoeCallDialog #btnStart").click(function(){
        	var status = $(this).attr("data-status");
        	if(status === "1"){
            	diagnosisStop();
        		$(this).attr("data-status","-1");
            	$(this).val("开 诊");
            	_roomComboBox.setEnabled(true);
    			$("#btnCallAgain,#btnCallNext,#btnSkipNumber").addClass("forbid");
    			$("#btnCallAgain,#btnCallNext,#btnSkipNumber").attr("disabled","disabled");
        	}
        	else{
            	var roomName = _roomComboBox.getText();
            	if(roomName === ''){
            		$.zoeMessageBox.warn('请先选择你所在的诊室！');
            		return;
            	}
            	//如果是新开诊的才提示确认
            	if(!_staffDutyRecord){
	            	var queueModelName = $(".radio-icon-check").html() + "门诊";
	       	  		$.zoeMessageBox.confirm('开诊确认','<strong style="color:red;">'+ roomName +'</strong>诊室,' + '<strong style="color:red;">'+ queueModelName +'</strong>?', function (result){
	       	  			if(result){
	       	            	diagnosisStart();
	       	  			}
	                });
            	}
            	else{
   	            	diagnosisStart();
            	}
        	}
        });
        
        $("#btnCallAgain").click(function(){
        	if(_callingQueueNo){
            	callNumber(_callingQueueNo.id);
        	}
        });
        
        $("#btnCallNext").click(function(){
        	callNext();
        });
        
        $("#btnSkipNumber").click(function(){
        	if(_callingQueueNo){
            	skipNumber(_callingQueueNo.id);
        	}
        });
        
        $("#evaluate").click(function(){
        	evaluate();
        })
	}
	
	//表格样式
	function gridStyle(){
		$(".t-hd tr td:last").css("background","#f0f4f7");
		$(".t-bd tr:odd").addClass("odd-row");
		var $tr = $(".t-bd tr");
		$tr.hover(function(e) {
	        $(this).toggleClass("over-row");
	    });
	    $tr.click(function() {
	    	$tr.siblings().removeClass('select-row');
	    	$(this).addClass('select-row')
	    });
	}

	//单选
	function radioBtn(){
		var $radioItem = $(".block span .radio-icon");
		$radioItem.click(function(e) {
			$(this).addClass("radio-icon-check").siblings().removeClass("radio-icon-check");		
	    });
	}

	//详细显示与隐藏
	function showList(){
		$("#showQueueNoListToggle").click(function(e) {
			$(".t-bd").getNiceScroll().resize();
			var status = $(this).hasClass("col-text-open");
			if(status==true){
				$(this).removeClass("col-text-open");
				$("#list").hide();
			}else{
				$(this).addClass("col-text-open");
				queryQueueNoList();
				$("#list").slideDown();
				//加载滚动条插件
				$('.t-bd').niceScroll({ zindex:99999,cursorcolor:'#bddeff',cursorwidth: '5px'});
			}
	    });
		
		//tab切换样式
		var $tabLi = $(".tab-item ul li");
		$tabLi.click(function(e) {
	        $(this).addClass("select").siblings().removeClass("select");
	        _currentQueueRecordId = $(this).attr("data-queueRecordId");
	        queryQueueNoList();
	    });
	}
	
	/**
	 * 开诊
	 */
	function diagnosisStart(){
       	$("#zoeCallDialog #btnStart").val("开诊中...");
		$("#zoeCallDialog #btnStart").addClass("forbid");
		$("#zoeCallDialog #btnStart").attr("disabled",'disabled');
		var queueModel = $("#radioQueueModel .radio-icon-check").attr("data-value");
		$.ajax({
			type : 'GET',
			data : {
				orgId : _orgId,
				staffCode : _staffCode,
				consultingRoomId : _roomComboBox.getValue(),
				queueModel : queueModel
			},
			url : _SERVICE_URL + '/diagnosisStart',
			dataType : 'jsonp',
			jsonp : '_jsonp',
			jsonpCallback : 'callback',
			success : function(result) {
				if(result.isSuccess){
					_staffDutyRecord = result.data;
					_currentQueueRecordId = _staffDutyRecord.queueRecordId;
					if(queueModel == 1){
						$("#queueModel_Ordinary").removeClass("select");
						$("#queueModel_Specialist").addClass("select");
						$("#queueModel_Specialist").attr("data-queuerecordid",_currentQueueRecordId);
					}else{
						$("#queueModel_Ordinary").attr("data-queuerecordid",_currentQueueRecordId);
						$("#queueModel_Specialist").remove();
					}
					$("#radioQueueModel .radio-icon").removeClass("radio-icon-check");
					$("#radioQueueModel .radio-icon[data-value="+ _staffDutyRecord.queueModel +"]").addClass("radio-icon-check");
					
					$("#showQueueNoListToggle").show();
   	        		$("#zoeCallDialog #btnStart").attr("data-status","1");
   	            	$("#zoeCallDialog #btnStart").val("停 诊");
   	            	_roomComboBox.setDisabled(true);
       	 			$("#btnCallAgain,#btnCallNext,#btnSkipNumber,#btnStart").removeClass("forbid");
       				$("#btnCallAgain,#btnCallNext,#btnSkipNumber,#btnStart").removeAttr("disabled");
				}
				else{
			       	$("#zoeCallDialog #btnStart").val("开 诊");
					$("#zoeCallDialog #btnStart").removeClass("forbid");
					$("#zoeCallDialog #btnStart").removeAttr("disabled");
					$.zoeMessageBox.warn("错误：" + result.errorMessage);
				}
			}
		});
	}
	

	/**
	 * 停诊
	 */
	function diagnosisStop(){
		$.ajax({
			type : 'GET',
			data : {
				staffDutyRecordId : _staffDutyRecord.id,
				staffCode : _staffCode
			},
			url : _SERVICE_URL + '/diagnosisStop',
			dataType : 'jsonp',
			jsonp : '_jsonp',
			jsonpCallback : 'callback',
			success : function(result) {
				if(result.isSuccess){
					_staffDutyRecord = result.data;
					$("#showQueueNoListToggle").hide();
					$("#showQueueNoListToggle").removeClass("col-text-open");
					$("#list").hide();
				}
				else{
					$.zoeMessageBox.warn(result.errorMessage);
				}
			}
		});
	}
	
	/**
	 * 呼叫下一个
	 */
	function callNext(){
		$.ajax({
			type : 'GET',
			data : {
				queueRecordId : _currentQueueRecordId,
				staffCode : _staffCode
			},
			url : _SERVICE_URL + '/callNext',
			dataType : 'jsonp',
			jsonp : '_jsonp',
			jsonpCallback : 'callback',
			success : function(result) {
				if (result.isSuccess) {
					_callingQueueNo = result.data;
					$("#callingQueueNo").html(_callingQueueNo.queueNo);
					queryQueueNoList();
				}
				else{
					$.zoeMessageBox.warn(result.errorMessage);
				}
			}
		});
	}

	/**
	 * 呼叫指定号码
	 */
	function callNumber(queueNoId){
		$.ajax({
			type : 'GET',
			data : {
				queueNoId : queueNoId,
				staffCode : _staffCode
			},
			url : _SERVICE_URL + '/callNumber',
			dataType : 'jsonp',
			jsonp : '_jsonp',
			jsonpCallback : 'callback',
			success : function(result) {
				if (result.isSuccess) {
					_callingQueueNo = result.data;
					$("#callingQueueNo").html(_callingQueueNo.queueNo);
					queryQueueNoList();
				}
				else{
					$.zoeMessageBox.warn(result.errorMessage);
				}
			}
		});
	}


	/**
	 * 呼叫指定号码
	 */
	function skipNumber(queueNoId){
		$.ajax({
			type : 'GET',
			data : {
				queueNoId : queueNoId,
				staffCode : _staffCode
			},
			url : _SERVICE_URL + '/skipNumber',
			dataType : 'jsonp',
			jsonp : '_jsonp',
			jsonpCallback : 'callback',
			success : function(result) {
				if (result.isSuccess) {
					//_callingQueueNo = result.data;
					//$("#callingQueueNo").html(_callingQueueNo.queueNo);
					queryQueueNoList();
				}
				else{
					$.zoeMessageBox.warn(result.errorMessage);
				}
			}
		});
	}
	
	function queryQueueNoList(queueNoStatus){
		if(!queueNoStatus){
			//queueNoStatus = _queueNoStatusComboBox.getValue();
			queueNoStatus = $("#zoeCallDialog #cbQueueNoStatus").val();
		}
		$.ajax({
			type : 'GET',
			data : {
				queueRecordId : _currentQueueRecordId,
				staffCode : _staffCode,
				queueNoStatus : queueNoStatus
			},
			url : _SERVICE_URL + '/queryQueueNoList',
			dataType : 'jsonp',
			jsonp : '_jsonp',
			jsonpCallback : 'callback',
			success : function(result) {
				if (result.isSuccess) {
					$("#tbQueueNoList tr").remove();
					var queueNoList = result.data;
					var $tbQueueNoList = $("#tbQueueNoList");
					var html;
					for(var i = 0, count = queueNoList.length; i< count; i++){
						var sickName = "";
						if(queueNoList[i].sickName != null){
							sickName = queueNoList[i].sickName;
						}
						html = html + '<tr>'+
			            				'<td>'+ (i+1) +'</td>'+
							            '<td>'+ queueNoList[i].queueNo +'</td>'+
							            '<td>'+ sickName +'</td>'+
							            '<td><a href="javascript:void(0);" class="notice-icon queueNo" data-queueNoId="'+ queueNoList[i].id +'"></a></td>'+
							          '</tr>';
					}
					$tbQueueNoList.append(html);
					//加载滚动条插件
					$('.t-bd').niceScroll({ zindex:99999,cursorcolor:'#bddeff',cursorwidth: '5px'});
			        $(".queueNo").click(function(){
			        	var queueNoId = $(this).attr("data-queueNoId");
			        	callNumber(queueNoId);
			        	queryQueueNoList();
			        });
				}
				else{
					$.zoeMessageBox.warn(result.errorMessage);
				}
			}
		});
	}
	
	window.ZoeCallDialog = ZoeCallDialog.prototype;
})(jQuery);;/**
* jQuery zoeUI 1.0.0
*  
* zoe核心
*/
(function ($)
{
    //zoeui 继承方法
    Function.prototype.zoeExtend = function (parent, overrides)
    {
        if (typeof parent != 'function') return this;
        //保存对父类的引用
        this.base = parent.prototype;
        this.base.constructor = parent;
        //继承
        var f = function () { };
        f.prototype = parent.prototype;
        this.prototype = new f();
        this.prototype.constructor = this;
        //附加属性方法
        if (overrides) $.extend(this.prototype, overrides);
    };
    //延时加载
    Function.prototype.zoeDefer = function (o, defer, args)
    {
        var fn = this;
        return setTimeout(function () { fn.apply(o, args || []); }, defer);
    };

    // 核心对象
    window.zoe = $.zoeui = {
        version: 'V1.0.0',
        managerCount: 0,
        //组件管理器池
        managers: {},
        managerIdPrev: 'zoeui',
        //管理器id已经存在时自动创建新的
        autoNewId: true,
        //错误提示
        error: {
            managerIsExist: '管理器id已经存在'
        },
        pluginPrev: 'zoe',
        getId: function (prev)
        {
            prev = prev || this.managerIdPrev;
            var id = prev + (1000 + this.managerCount);
            this.managerCount++;
            return id;
        },
        add: function (manager)
        {
            if (arguments.length == 2)
            {
                var m = arguments[1];
                m.id = m.id || m.options.id || arguments[0].id;
                this.addManager(m);
                return;
            }
            if (!manager.id) manager.id = this.getId(manager.__idPrev());
            //if (this.managers[manager.id]) manager.id = this.getId(manager.__idPrev());
            //if (this.managers[manager.id])
            //{
            //    throw new Error(this.error.managerIsExist);
            //}
            this.managers[manager.id] = manager;
        },
        remove: function (arg)
        {
            if (typeof arg == "string" || typeof arg == "number")
            {
                delete zoe.managers[arg];
            }
            else if (typeof arg == "object")
            {
                if (arg instanceof zoe.core.Component)
                {
                    delete zoe.managers[arg.id];
                }
                else
                {
                    if (!$(arg).attr(this.idAttrName)) return false;
                    delete zoe.managers[$(arg).attr(this.idAttrName)];
                }
            }
        },
        //获取zoeui对象
        //1,传入zoeui ID
        //2,传入Dom Object
        get: function (arg, idAttrName)
        {
            idAttrName = idAttrName || "zoeuiid";
            if (typeof arg == "string" || typeof arg == "number")
            {
                return zoe.managers[arg];
            }
            else if (typeof arg == "object")
            {
                var domObj = arg.length ? arg[0] : arg;
                var id = domObj[idAttrName] || $(domObj).attr(idAttrName);
                if (!id) return null;
                return zoe.managers[id];
            }
            return null;
        },
        //根据类型查找某一个对象
        find: function (type)
        {
            var arr = [];
            for (var id in this.managers)
            {
                var manager = this.managers[id];
                if (type instanceof Function)
                {
                    if (manager instanceof type)
                    {
                        arr.push(manager);
                    }
                }
                else if (type instanceof Array)
                {
                    if ($.inArray(manager.__getType(), type) != -1)
                    {
                        arr.push(manager);
                    }
                }
                else
                {
                    if (manager.__getType() == type)
                    {
                        arr.push(manager);
                    }
                }
            }
            return arr;
        },
        //$.fn.zoe{Plugin} 和 $.fn.zoeGet{Plugin}Manager
        //会调用这个方法,并传入作用域(this)
        //parm [plugin]  插件名
        //parm [args] 参数(数组)
        //parm [ext] 扩展参数,定义命名空间或者id属性名
        run: function (plugin, args, ext)
        {
            if (!plugin) return;
            ext = $.extend({
                defaultsNamespace: 'zoeDefaults',
                methodsNamespace: 'zoeMethods',
                controlNamespace: 'controls',
                idAttrName: 'zoeuiid',
                isStatic: false,
                hasElement: true,           //是否拥有element主体(比如drag、resizable等辅助性插件就不拥有)
                propertyToElemnt: null      //链接到element的属性名
            }, ext || {});
            plugin = plugin.replace(/^zoeGet/, '');
            plugin = plugin.replace(/^zoe/, '');
            if (this == null || this == window || ext.isStatic)
            {
                if (!zoe.plugins[plugin])
                {
                    zoe.plugins[plugin] = {
                        fn: $[zoe.pluginPrev + plugin],
                        isStatic: true
                    };
                }
                return new $.zoeui[ext.controlNamespace][plugin]($.extend({}, $[ext.defaultsNamespace][plugin] || {}, $[ext.defaultsNamespace][plugin + 'String'] || {}, args.length > 0 ? args[0] : {}));
            }
            if (!zoe.plugins[plugin])
            {
                zoe.plugins[plugin] = {
                    fn: $.fn[zoe.pluginPrev + plugin],
                    isStatic: false
                };
            }
            if (/Manager$/.test(plugin)) return zoe.get(this, ext.idAttrName);
            this.each(function ()
            {
                if (this[ext.idAttrName] || $(this).attr(ext.idAttrName))
                {
                    var manager = zoe.get(this[ext.idAttrName] || $(this).attr(ext.idAttrName));
                    if (manager && args.length > 0) manager.set(args[0]);
                    //已经执行过 
                    return;
                }
                if (args.length >= 1 && typeof args[0] == 'string') return;
                //只要第一个参数不是string类型,都执行组件的实例化工作
                var options = args.length > 0 ? args[0] : null;
                var p = $.extend({}, $[ext.defaultsNamespace][plugin], $[ext.defaultsNamespace][plugin + 'String'], options);
                if (ext.propertyToElemnt) p[ext.propertyToElemnt] = this;
                if (ext.hasElement)
                {
                    new $.zoeui[ext.controlNamespace][plugin](this, p);
                }
                else
                {
                    new $.zoeui[ext.controlNamespace][plugin](p);
                }
            });
            if (this.length == 0) return null;
            if (args.length == 0) return zoe.get(this, ext.idAttrName);
            if (typeof args[0] == 'object') return zoe.get(this, ext.idAttrName);
            if (typeof args[0] == 'string')
            {
                var manager = zoe.get(this, ext.idAttrName);
                if (manager == null) return;
                if (args[0] == "option")
                {
                    if (args.length == 2)
                        return manager.get(args[1]);  //manager get
                    else if (args.length >= 3)
                        return manager.set(args[1], args[2]);  //manager set
                }
                else
                {
                    var method = args[0];
                    if (!manager[method]) return; //不存在这个方法
                    var parms = Array.apply(null, args);
                    parms.shift();
                    return manager[method].apply(manager, parms);  //manager method
                }
            }
            return null;
        },

        //扩展
        //1,默认参数     
        //2,本地化扩展 
        defaults: {},
        //3,方法接口扩展
        methods: {},
        //命名空间
        //核心控件,封装了一些常用方法
        core: {},
        //命名空间
        //组件的集合
        controls: {},
        //plugin 插件的集合
        plugins: {}
    };


    //扩展对象
    $.zoeDefaults = {};

    //扩展对象
    $.zoeMethos = {};

    //关联起来
    zoe.defaults = $.zoeDefaults;
    zoe.methods = $.zoeMethos;

    //获取zoeui对象
    //parm [plugin]  插件名,可为空
    $.fn.zoe = function (plugin)
    {
        if (plugin)
        {
            return zoe.run.call(this, plugin, arguments);
        }
        else
        {
            return zoe.get(this);
        }
    };


    //组件基类
    //1,完成定义参数处理方法和参数属性初始化的工作
    //2,完成定义事件处理方法和事件属性初始化的工作
    zoe.core.Component = function (options)
    {
        //事件容器
        this.events = this.events || {};
        //配置参数
        this.options = options || {};
        //子组件集合索引
        this.children = {};
    };
    $.extend(zoe.core.Component.prototype, {
        __getType: function ()
        {
            return 'zoe.core.Component';
        },
        __idPrev: function ()
        {
            return 'zoeui';
        },

        //设置属性
        // arg 属性名    value 属性值 
        // arg 属性/值   value 是否只设置事件
        set: function (arg, value)
        {
            if (!arg) return;
            if (typeof arg == 'object')
            {
                var tmp;
                if (this.options != arg)
                {
                    $.extend(this.options, arg);
                    tmp = arg;
                }
                else
                {
                    tmp = $.extend({}, arg);
                }
                if (value == undefined || value == true)
                {
                    for (var p in tmp)
                    {
                        if (p.indexOf('on') == 0)
                            this.set(p, tmp[p]);
                    }
                }
                if (value == undefined || value == false)
                {
                    for (var p in tmp)
                    {
                        if (p.indexOf('on') != 0)
                            this.set(p, tmp[p]);
                    }
                }
                return;
            }
            var name = arg;
            //事件参数
            if (name.indexOf('on') == 0)
            {
                if (typeof value == 'function')
                    this.bind(name.substr(2), value);
                return;
            }
            if (!this.options) this.options = {};
            if (this.trigger('propertychange', [arg, value]) == false) return;
            this.options[name] = value;
            var pn = '_set' + name.substr(0, 1).toUpperCase() + name.substr(1);
            if (this[pn])
            {
                this[pn].call(this, value);
            }
            this.trigger('propertychanged', [arg, value]);
        },

        //获取属性
        get: function (name)
        {
            var pn = '_get' + name.substr(0, 1).toUpperCase() + name.substr(1);
            if (this[pn])
            {
                return this[pn].call(this, name);
            }
            return this.options[name];
        },

        hasBind: function (arg)
        {
            var name = arg.toLowerCase();
            var event = this.events[name];
            if (event && event.length) return true;
            return false;
        },

        //触发事件
        //data (可选) Array(可选)传递给事件处理函数的附加参数
        trigger: function (arg, data)
        {
            if (!arg) return;
            var name = arg.toLowerCase();
            var event = this.events[name];
            if (!event) return;
            data = data || [];
            if ((data instanceof Array) == false)
            {
                data = [data];
            }
            for (var i = 0; i < event.length; i++)
            {
                var ev = event[i];
                if (ev.handler.apply(ev.context, data) == false)
                    return false;
            }
        },

        //绑定事件
        bind: function (arg, handler, context)
        {
            if (typeof arg == 'object')
            {
                for (var p in arg)
                {
                    this.bind(p, arg[p]);
                }
                return;
            }
            if (typeof handler != 'function') return false;
            var name = arg.toLowerCase();
            var event = this.events[name] || [];
            context = context || this;
            event.push({ handler: handler, context: context });
            this.events[name] = event;
        },

        //取消绑定
        unbind: function (arg, handler)
        {
            if (!arg)
            {
                this.events = {};
                return;
            }
            var name = arg.toLowerCase();
            var event = this.events[name];
            if (!event || !event.length) return;
            if (!handler)
            {
                delete this.events[name];
            }
            else
            {
                for (var i = 0, l = event.length; i < l; i++)
                {
                    if (event[i].handler == handler)
                    {
                        event.splice(i, 1);
                        break;
                    }
                }
            }
        },
        destroy: function ()
        {
            zoe.remove(this);
        }
    });


    //界面组件基类, 
    //1,完成界面初始化:设置组件id并存入组件管理器池,初始化参数
    //2,渲染的工作,细节交给子类实现
    //parm [element] 组件对应的dom element对象
    //parm [options] 组件的参数
    zoe.core.UIComponent = function (element, options)
    {
        zoe.core.UIComponent.base.constructor.call(this, options);
        var extendMethods = this._extendMethods();
        if (extendMethods) $.extend(this, extendMethods);
        this.element = element;
        this._init();
        this._preRender();
        this.trigger('render');
        this._render();
        this.trigger('rendered');
        this._rendered();
    };
    zoe.core.UIComponent.zoeExtend(zoe.core.Component, {
        __getType: function ()
        {
            return 'zoe.core.UIComponent';
        },
        //扩展方法
        _extendMethods: function ()
        {

        },
        _init: function ()
        {
            this.type = this.__getType();
            if (!this.element)
            {
                this.id = this.options.id || zoe.getId(this.__idPrev());
            }
            else
            {
                this.id = this.options.id || this.element.id || zoe.getId(this.__idPrev());
            }
            //存入管理器池
            zoe.add(this);

            if (!this.element) return;

            //读取attr方法,并加载到参数,比如['url']
            var attributes = this.attr();
            if (attributes && attributes instanceof Array)
            {
                for (var i = 0; i < attributes.length; i++)
                {
                    var name = attributes[i];
                    this.options[name] = $(this.element).attr(name);
                }
            }
            //读取zoeui这个属性，并加载到参数，比如 zoeui = "width:120,heigth:100"
            var p = this.options;
            if ($(this.element).attr("zoeui"))
            {
                try
                {
                    var attroptions = $(this.element).attr("zoeui");
                    if (attroptions.indexOf('{') != 0) attroptions = "{" + attroptions + "}";
                    eval("attroptions = " + attroptions + ";");
                    if (attroptions) $.extend(p, attroptions);
                }
                catch (e) { }
            }
        },
        //预渲染,可以用于继承扩展
        _preRender: function ()
        {

        },
        _render: function ()
        {

        },
        _rendered: function ()
        {
            if (this.element)
            {
                $(this.element).attr("zoeuiid", this.id);
            }
        },
        _setCls: function (value)
        {
            if (this.element && value)
            {
                $(this.element).addClass(value);
            }
        },
        //返回要转换成zoeui参数的属性,比如['url']
        attr: function ()
        {
            return [];
        },
        destroy: function ()
        {
            if (this.element)
            {
                $(this.element).remove();
            }
            this.options = null;
            zoe.remove(this);
        }
    });


    //表单控件基类
    zoe.controls.Input = function (element, options)
    {
        zoe.controls.Input.base.constructor.call(this, element, options);
    };

    zoe.controls.Input.zoeExtend(zoe.core.UIComponent, {
        __getType: function ()
        {
            return 'zoe.controls.Input';
        },
        attr: function ()
        {
            return ['nullText'];
        },
        setValue: function (value)
        {
            return this.set('value', value);
        },
        getValue: function ()
        {
            return this.get('value');
        },
        //设置只读
        _setReadonly: function (readonly)
        {
            var wrapper = this.wrapper || this.text;
            if (!wrapper || !wrapper.hasClass("l-text")) return;
            var inputText = this.inputText;
            if (readonly)
            {
                if (inputText) inputText.attr("readonly", "readonly");
                wrapper.addClass("l-text-readonly");
            } else
            {
                if (inputText) inputText.removeAttr("readonly");
                wrapper.removeClass("l-text-readonly");
            }
        },
        setReadonly: function (readonly)
        {
            return this.set('readonly', readonly);
        },
        setEnabled: function ()
        {
            return this.set('disabled', false);
        },
        setDisabled: function ()
        {
            return this.set('disabled', true);
        },
        updateStyle: function ()
        {

        },
        resize: function (width, height)
        {
            this.set({ width: width, height: height + 2 });
        }
    });

    //全局窗口对象
    zoe.win = {
        //顶端显示
        top: false,

        //遮罩
        mask: function (win)
        {
            function setHeight()
            {
                if (!zoe.win.windowMask) return;
                var h = $(window).height() + $(window).scrollTop();
                zoe.win.windowMask.height(h);
            }
            if (!this.windowMask)
            {
                this.windowMask = $("<div class='l-window-mask' style='display: block;'></div>").appendTo('body');
                $(window).bind('resize.zoeuiwin', setHeight);
                $(window).bind('scroll', setHeight);
            }
            this.windowMask.show();
            setHeight();
            this.masking = true;
        },

        //取消遮罩
        unmask: function (win)
        {
            var jwins = $("body > .l-dialog:visible,body > .l-window:visible");
            for (var i = 0, l = jwins.length; i < l; i++)
            {
                var winid = jwins.eq(i).attr("zoeuiid");
                jwins.eq(i).css("z-index", "9200");
                if (win && win.id == winid) continue;
                //获取zoeui对象
                var winmanager = zoe.get(winid);
                if (!winmanager) continue;
                //是否模态窗口
                var modal = winmanager.get('modal');
                //如果存在其他模态窗口，那么不会取消遮罩
                if (modal) return;
            }
            if (this.windowMask)
                this.windowMask.hide();
            this.masking = false;
        },

        //显示任务栏
        createTaskbar: function ()
        {
            if (!this.taskbar)
            {
                this.taskbar = $('<div class="l-taskbar"><div class="l-taskbar-tasks"></div><div class="l-clear"></div></div>').appendTo('body');
                if (this.top) this.taskbar.addClass("l-taskbar-top");
                this.taskbar.tasks = $(".l-taskbar-tasks:first", this.taskbar);
                this.tasks = {};
            }
            this.taskbar.show();
            this.taskbar.animate({ bottom: 0 });
            return this.taskbar;
        },

        //关闭任务栏
        removeTaskbar: function ()
        {
            var self = this;
            self.taskbar.animate({ bottom: -32 }, function ()
            {
                self.taskbar.remove();
                self.taskbar = null;
            });
        },
        activeTask: function (win)
        {
            for (var winid in this.tasks)
            {
                var t = this.tasks[winid];
                if (winid == win.id)
                {
                    t.addClass("l-taskbar-task-active");
                }
                else
                {
                    t.removeClass("l-taskbar-task-active");
                }
            }
        },

        //获取任务
        getTask: function (win)
        {
            var self = this;
            if (!self.taskbar) return;
            if (self.tasks[win.id]) return self.tasks[win.id];
            return null;
        },


        //增加任务
        addTask: function (win)
        {
            var self = this;
            if (!self.taskbar) self.createTaskbar();
            if (self.tasks[win.id]) return self.tasks[win.id];
            var title = win.get('title');
            var task = self.tasks[win.id] = $('<div class="l-taskbar-task"><div class="l-taskbar-task-icon"></div><div class="l-taskbar-task-content">' + title + '</div></div>');
            self.taskbar.tasks.append(task);
            self.activeTask(win);
            task.bind('click', function ()
            {
                self.activeTask(win);
                if (win.actived)
                    win.min();
                else
                    win.active();
            }).hover(function ()
            {
                $(this).addClass("l-taskbar-task-over");
            }, function ()
            {
                $(this).removeClass("l-taskbar-task-over");
            });
            return task;
        },

        hasTask: function ()
        {
            for (var p in this.tasks)
            {
                if (this.tasks[p])
                    return true;
            }
            return false;
        },

        //移除任务
        removeTask: function (win)
        {
            var self = this;
            if (!self.taskbar) return;
            if (self.tasks[win.id])
            {
                self.tasks[win.id].unbind();
                self.tasks[win.id].remove();
                delete self.tasks[win.id];
            }
            if (!self.hasTask())
            {
                self.removeTaskbar();
            }
        },

        //前端显示
        setFront: function (win)
        {
            var wins = zoe.find(zoe.core.Win);
            var jwins = $("body > .l-dialog:visible");
            for (var i in wins)
            {
                var w = wins[i];               
                if ( w != win )
                {
                    $(w.element).css("z-index", "9100");
                }
                if ( w == win && $(w.element).is(":hidden"))
                {
                    $(w.element).css("z-index", "9100");
                }
            }
            for (var s in wins)
            {
                var t = wins[s];               
                if ( t == win )
                {
                    $(t.element).css("z-index", "9200");
                    this.activeTask(t);
                }
                if ( t != win && jwins.length == 1)
                {
                    $(t.element).css("z-index", "9200");
                    this.activeTask(t);
                }
            }
        }
    };


    //窗口基类 window、dialog
    zoe.core.Win = function (element, options)
    {
        zoe.core.Win.base.constructor.call(this, element, options);
    };

    zoe.core.Win.zoeExtend(zoe.core.UIComponent, {
        __getType: function ()
        {
            return 'zoe.controls.Win';
        },
        mask: function ()
        {
            if (this.options.modal)
                zoe.win.mask(this);
        },
        unmask: function ()
        {
            if (this.options.modal)
                zoe.win.unmask(this);
        },
        min: function ()
        {
        },
        max: function ()
        {
        },
        active: function ()
        {
        }
    });


    zoe.draggable = {
        dragging: false
    };

    zoe.resizable = {
        reszing: false
    };


    zoe.toJSON = typeof JSON === 'object' && JSON.stringify ? JSON.stringify : function (o)
    {
        var f = function (n)
        {
            return n < 10 ? '0' + n : n;
        },
		escapable = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
		quote = function (value)
		{
		    escapable.lastIndex = 0;
		    return escapable.test(value) ?
				'"' + value.replace(escapable, function (a)
				{
				    var c = meta[a];
				    return typeof c === 'string' ? c :
						'\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
				}) + '"' :
				'"' + value + '"';
		};
        if (o === null) return 'null';
        var type = typeof o;
        if (type === 'undefined') return undefined;
        if (type === 'string') return quote(o);
        if (type === 'number' || type === 'boolean') return '' + o;
        if (type === 'object')
        {
            if (typeof o.toJSON === 'function')
            {
                return zoe.toJSON(o.toJSON());
            }
            if (o.constructor === Date)
            {
                return isFinite(this.valueOf()) ?
                   this.getUTCFullYear() + '-' +
                 f(this.getUTCMonth() + 1) + '-' +
                 f(this.getUTCDate()) + 'T' +
                 f(this.getUTCHours()) + ':' +
                 f(this.getUTCMinutes()) + ':' +
                 f(this.getUTCSeconds()) + 'Z' : null;
            }
            var pairs = [];
            if (o.constructor === Array)
            {
                for (var i = 0, l = o.length; i < l; i++)
                {
                    pairs.push(zoe.toJSON(o[i]) || 'null');
                }
                return '[' + pairs.join(',') + ']';
            }
            var name, val;
            for (var k in o)
            {
                type = typeof k;
                if (type === 'number')
                {
                    name = '"' + k + '"';
                } else if (type === 'string')
                {
                    name = quote(k);
                } else
                {
                    continue;
                }
                type = typeof o[k];
                if (type === 'function' || type === 'undefined')
                {
                    continue;
                }
                val = zoe.toJSON(o[k]);
                pairs.push(name + ':' + val);
            }
            return '{' + pairs.join(',') + '}';
        }
    };

    //获取 默认的编辑构造器
    zoe.getEditor = function (e)
    {
        var type = e.type, control = e.control, master = e.master;
        if (!type) return null;
        var inputTag = 0;
        if (control) control = control.substr(0, 1).toUpperCase() + control.substr(1);
        var defaultOp = {
            create: function (container, editParm, controlOptions)
            {
                //field in form , column in grid
                var field = editParm.field || editParm.column, options = controlOptions || {};
                var isInGrid = editParm.column ? true : false;
                var p = $.extend({}, e.options);
                var inputType = "text";
                if ($.inArray(type, ["password", "file", "checkbox", "radio"]) != -1) inputType = type;
                if (e.password) inputType = "password";
                var inputBody = $("<input type='" + inputType + "'/>");
                if (e.body)
                {
                    inputBody = e.body.clone();
                }
                inputBody.appendTo(container);
                if (editParm.field)
                {
                    var txtInputName = field.name;
                    var prefixID = $.isFunction(options.prefixID) ? options.prefixID(master) : (options.prefixID || "");
                    p.id = field.id || (prefixID + field.name);
                    if ($.inArray(type, ["select", "combobox", "autocomplete", "popup"]) != -1)
                    {
                        txtInputName = field.textField || field.comboboxName;
                        if (field.comboboxName && !field.id)
                            p.id = (options.prefixID || "") + field.comboboxName;
                    }
                    if ($.inArray(type, ["select", "combobox", "autocomplete", "popup", "radiolist", "checkboxlist", "listbox"]) != -1)
                    {
                        p.valueFieldID = prefixID + field.name;
                    }
                    if (!e.body)
                    {
                        var inputName = prefixID + txtInputName;
                        var inputId = new Date().getTime() + "_" + ++inputTag + "_" + field.name;
                        inputBody.attr($.extend({
                            id: inputId,
                            name: inputName
                        }, field.attr));
                        if (field.cssClass)
                        {
                            inputBody.addClass(field.cssClass);
                        }
                        if (field.validate && !master.options.unSetValidateAttr)
                        {
                            inputBody.attr('validate', zoe.toJSON(field.validate));
                        }
                    }
                    $.extend(p, field.options);
                }
                if (field.dictionary) //字典字段，比如:男|女
                {
                    field.editor = field.editor || {};
                    if (!field.editor.data)
                    {
                        var dicEditorData = [], dicItems = field.dictionary.split('|');
                        $(dicItems).each(function (i, dicItem)
                        {
                            var dics = dicItem.split(',');
                            var dicItemId = dics[0], dicItemText = dics.length >= 2 ? dics[1] : dics[0];
                            dicEditorData.push({
                                id: dicItemId,
                                value: dicItemId,
                                text: dicItemText
                            });
                        });
                        field.editor.data = dicEditorData;
                    }
                }
                if (field.editor)
                {
                    if (field.editor.options)
                    {
                        $.extend(p, field.editor.options);
                        //delete field.editor.options;
                    }
                    if (field.editor.valueColumnName)
                    {
                        p.valueField = field.editor.valueColumnName;
                       // delete field.editor.valueColumnName;
                    }
                    if (field.editor.displayColumnName)
                    {
                        p.textField = field.editor.displayColumnName;
                        //delete field.editor.displayColumnName;
                    }
                    //可扩展参数,支持动态加载
                    var ext = field.editor.p || field.editor.ext;
                    if (ext)
                    {
                        ext = typeof (ext) == 'function' ? ext(editParm) : ext;
                        $.extend(p, ext);
                        //delete field.editor.p;
                        //delete field.editor.ext;
                    } 
                    $.extend(p, field.editor); 
                }
           
                if (isInGrid)
                {
                    p.host_grid = this;
                    p.host_grid_row = editParm.record;
                    p.host_grid_column = editParm.column;
                } else 
                {
                    p.host_form = this;

                    if (field.readonly || p.host_form.get('readonly'))
                    {
                        p.readonly = true;
                    }
                } 
                //返回的是zoeui对象
                var lobj = inputBody['zoe' + control](p);
                if (isInGrid)
                {
                    setTimeout(function () { inputBody.focus(); }, 100);
                }
                return lobj;
            },
            getValue: function (editor, editParm)
            {
                var field = editParm.field || editParm.column; 
                if (editor.getValue)
                {
                    var value = editor.getValue();
                    var edtirType = editParm.column ? editParm.column.editor.type : editParm.field.type;
                    //isArrayValue属性可将提交字段数据改成[id1,id2,id3]的形式
                    if (field && field.editor && field.editor.isArrayValue && value)
                    {
                        value = value.split(';');
                    }
                    //isRef属性可将提交字段数据改成[id,value]的形式
                    if (field && field.editor && field.editor.isRef && editor.getText)
                    {
                        value = [value, editor.getText()];
                    }
                    //isRefMul属性可将提交字段数据改成[[id1,value1],[id2,value2]]的形式
                    if (field && field.editor && field.editor.isRefMul && editor.getText)
                    {
                        var vs = value.split(';');
                        var ts = editor.getText().split(';'); 
                        value = [];
                        for (var i = 0; i < vs.length; i++)
                        {
                            value.push([vs[i], ts[i]]);
                        }
                    }
                    if (edtirType == "int" || edtirType == "digits")
                    {
                        value = value ? parseInt(value, 10) : 0;
                    }
                    else if (edtirType == "float" || edtirType == "number")
                    {
                        value = value ? parseFloat(value) : 0;
                    }
                    return value;
                }
            },
            setValue: function (editor, value, editParm)
            { 
                var field = editParm.field || editParm.column; 
                if (editor.setValue)
                {
                    //设置了isArrayValue属性- 如果获取到的数据是[id1,id2,id3]的形式，需要合并为一个完整字符串
                    if (field && field.editor && field.editor.isArrayValue && value)
                    {
                        value = value.join(';');
                    }
                    //设置了isRef属性-如果获取到的数据是[id,text]的形式，需要获取[0]
                    if (field && field.editor && field.editor.isRef && $.isArray(value))
                    {
                        value = value[0];
                    }
                    //设置了isRefMul属性- 获取到[[id1,value1],[id2,value2]]的形式，需要合并为一个完整字符串
                    if (field && field.editor && field.editor.isRefMul && $.isArray(value))
                    {
                        var vs = [];
                        for (var i = 0; i < value.length; i++)
                        {
                            vs.push(value[i].length > 1 ? value[i][1] : value[i][0]);
                        }
                        value = vs.join(';');
                    }
                    //当value为null时也能把form中field原先的值替换掉
                    if(value == null){
                        value = "";
                    }
                    editor.setValue(value);
                } 
            },
            //从控件获取到文本信息
            getText: function (editor, editParm)
            {
                var field = editParm.field || editParm.column;
                if (editor.getText)
                {
                    var text = editor.getText();
                    if (text) return text; 
                }
            },
            //设置文本信息到控件去
            setText: function (editor, text, editParm)
            { 
                if (text && editor.setText)
                {
                    editor.setText(text);
                }
                    //如果没有把数据保存到 textField 字段，那么需要获取值字段
                else
                {
                    var field = editParm.field || editParm.column;
                    text = editor.setValue() || editParm.value || "";
                    //如果获取到的数据是[id,text]的形式，需要获取[0]
                    if (field && field.editor && field.editor.isRef && $.isArray(text) && text.length > 1)
                    {
                        text = text[1];
                    }
                    //在grid的编辑里面 获取到[[id1,value1],[id2,value2]]的形式，需要合并为一个完整字符串
                    if (field && field.editor && field.editor.isRefMul && $.isArray(text) && text.length > 1)
                    {
                        var vs = [];
                        for (var i = 0; i < text.length; i++)
                        {
                            vs.push(text[1]);
                        }
                        text = vs.join(';');
                    }
                    if (editor.setText)
                    {
                        editor.setText(text);
                    }
                }
            },
            getSelected: function (editor, editParm)
            {
                if (editor.getSelected)
                {
                    return editor.getSelected();
                }
            },
            resize: function (editor, width, height, editParm)
            {
                if (editParm.field) width = width - 2;
                if (editor.resize) editor.resize(width, height);
            },
            setEnabled: function (editor, isEnabled)
            {
                if (isEnabled)
                {
                    if (editor.setEnabled) editor.setEnabled();
                }
                else
                {
                    if (editor.setDisabled) editor.setDisabled();
                }
            },
            destroy: function (editor, editParm)
            {
                if (editor.destroy) editor.destroy();
            }
        };
        
        return $.extend({}, defaultOp, zoe.editorCreatorDefaults || {}, e);
    }
    //几个默认的编辑器构造函数
    zoe.editors = {
        "text": {
            control: 'TextBox'
        },
        "date": {
            control: 'DateEditor',
            setValue: function (editor, value, editParm)
            {
                // /Date(1328423451489)/
                if (typeof value == "string" && /^\/Date/.test(value))
                {
                    value = value.replace(/^\//, "new ").replace(/\/$/, "");
                    eval("value = " + value);
                }
                editor.setValue(value);
            }
        },
        "combobox": {
            control: 'ComboBox'
            //options: { cancelable: false,autocomplete:true }
        },
        "spinner": {
            control: 'Spinner'
        },
        "checkbox": {
            control: 'CheckBox'
        },
        "checkboxlist": {
            control: 'CheckBoxList',
            body: $('<div></div>'),
            resize: function (editor, width, height, editParm)
            {
                editor.set('width', width - 2);
            }
        },
        "radiolist": {
            control: 'RadioList',
            body: $('<div></div>'),
            resize: function (editor, width, height, editParm)
            {
                editor.set('width', width - 2);
            }
        },
        "listbox": {
            control: 'ListBox',
            body: $('<div></div>'),
            resize: function (editor, width, height, editParm)
            {
                editor.set('width', width - 2);
            }
        },
        "popup": {
            control: 'PopupEdit'
        },
        "number": {
            control: 'TextBox',
            options: { number: true }
        },
        "currency": {
            control: 'TextBox',
            options: { currency: true }
        },
        "digits": {
            control: 'TextBox',
            options: { digits: true }
        },
        "password": {
            control: 'TextBox',
            password: true
        }
    };
    zoe.editors["string"] = zoe.editors["text"];
    zoe.editors["select"] = zoe.editors["combobox"];
    zoe.editors["int"] = zoe.editors["digits"];
    zoe.editors["float"] = zoe.editors["number"];
    zoe.editors["chk"] = zoe.editors["checkbox"];
    zoe.editors["popupedit"] = zoe.editors["popup"];

    //jQuery version fix
    $.fn.live = $.fn.on ? $.fn.on : $.fn.live;
    if (!$.browser)
    {
        var userAgent = navigator.userAgent.toLowerCase();
        $.browser = {
            version: (userAgent.match(/.+(?:rv|it|ra|ie)[\/: ]([\d.]+)/) || [0, '0'])[1],
            safari: /webkit/.test(userAgent),
            opera: /opera/.test(userAgent),
            msie: /msie/.test(userAgent) && !/opera/.test(userAgent),
            mozilla: /mozilla/.test(userAgent) && !/(compatible|webkit)/.test(userAgent)
        };
    }
})(jQuery);


﻿/**
* jQuery zoeUI 1.0.0
* 
*/
(function ($)
{
    /*
    以html的方式加载组件
    程序会查询以 zoe-插件名 类名的Dom,从dom加载相应的参数并调用插件
        比如遇到 .zoe-grid 的dom，会找到 zoe.defaults.Grid 加载需要的参数
        而在config.Grid中配置了这些参数的类型,会动态得加载data,而columns会设置为数组
    参数处理的优先级为：
    1,ignores 忽略不处理的参数
    2,dom存在 {属性名} 的类名 ,比如 <ul class="columns"></ul> ,便会将这个参数设置为复杂属性(object或array):找到相应的defaults和config来加载
         defaults是先找$.zoe.inject.defaults,找不到再找zoe.defaults的
         config为{父配置}.{属性名},比如 config.Grid.columns
    3,直接读取 data-{属性名} 或者 {属性名} 的dom属性
    */
    zoe.inject = {

        prev: 'zoe-',

        /* 
        命名规则：插件名_属性名(包括第N级的属性) (插件名首字母大写,属性名首字母小写) 
        获取规则：获取default时会先找这里,找不到再找zoe.defaults,比如 zoe.defaults.Grid_columns 
        备注：这里只定义了参数的列表
        */
        defaults: {
            Grid_detail: {
                height: null,
                onShowDetail: null
            },
            Grid_editor: 'ComboBox,DateEditor,Spinner,TextBox,PopupEdit,CheckBoxList,RadioList,Grid_editor',
            Grid_popup: 'PopupEdit',
            Grid_grid: 'Grid',
            Grid_condition: 'Form',
            Grid_toolbar: 'Toolbar',
            Grid_fields: 'Form_fields',
            Form_editor: 'ComboBox,DateEditor,Spinner,TextBox,PopupEdit,CheckBoxList,RadioList,Form_editor',
            Form_grid: 'Grid',
            Form_columns: 'Grid_columns',
            Form_condition: 'Form',
            Form_popup: 'PopupEdit',
            Form_buttons: 'Button',
            Portal_panel: 'Panel'
        },
        /*
        config里面配置了某插件参数或者复杂属性参数的类型(动态加载、数组、默认参数)
        */
        config: {
            Grid: {
                //动态
                dynamics: 'data,isChecked,detail,rowDraggingRender,toolbar,columns',
                //数组
                arrays: 'columns',
                //复杂属性columns
                columns: {
                    dynamics: 'render,totalSummary,headerRender,columns,editor,columns',
                    arrays: 'columns',
                    textProperty: 'display',
                    columns: 'zoe.inject.config.Grid.columns',
                    editor: {
                        dynamics: 'data,columns,render,renderItem,grid,condition,ext',
                        grid: 'zoe.inject.config.Grid',
                        condition: 'zoe.inject.config.Form'
                    }
                },
                toolbar: {
                    arrays: 'items'
                }
            },
            Form: {
                dynamics: 'validate,fields,buttons',
                arrays: 'fields,buttons',
                fields: {
                    textProperty: 'label',
                    dynamics: 'validate,editor',
                    editor: {
                        dynamics: 'data,columns,render,renderItem,grid,condition,attr',
                        grid: 'zoe.inject.config.Grid',
                        condition: 'zoe.inject.config.Form'
                    }
                },
                buttons: 'zoe.inject.config.Button'
            },
            PopupEdit: {
                dynamics: 'grid,condition'
            },
            Button: {
                textProperty: 'text',
                dynamics: 'click'
            },
            ComboBox: {
                dynamics: 'columns,data,tree,grid,condition,render,parms,renderItem'
            },
            ListBox: {
                dynamics: 'columns,data,render,parms'
            },
            RadioList: {
                dynamics: 'data,parms'
            },
            CheckBoxList: {
                dynamics: 'data,parms'
            },
            Panel: {
            },
            Portal: {
                //动态
                dynamics: 'rows,columns',
                //数组
                arrays: 'rows,columns',
                //复杂属性 columns
                columns: {
                    dynamics: 'panels',
                    arrays: 'panels'
                },
                //复杂属性 rows
                rows: {
                    dynamics: 'panels',
                    arrays: 'panels'
                },
                toolbar: {
                    arrays: 'items'
                }
            }
        },

        parse: function (code)
        {
            try
            {
                if (code == null) return null;
                return new Function("return " + code + ";")();
            } catch (e)
            {
                return null;
            }
        },

        parseDefault: function (value)
        {
            var g = this;
            if (!value) return value;
            var result = {};
            $(value.split(',')).each(function (index, name)
            {
                if (!name) return;
                name = name.substr(0, 1).toUpperCase() + name.substr(1);
                $.extend(result, g.parse("zoe.defaults." + name));
            });
            return result;
        },

        fotmatValue: function (value, type)
        {
            if (type == "boolean")
                return value == "true" || value == "1";
            if (type == "number" && value)
                return parseFloat(value.toString());
            return value;
        },

        getOptions: function (e)
        {
            var jelement = e.jelement, defaults = e.defaults, config = e.config;
            config = $.extend({
                ignores: "",
                dynamics: "",
                arrays: ""
            }, config);
            var g = this, options = {}, value;
            if (config.textProperty) options[config.textProperty] = jelement.text();
            for (var proName in defaults)
            {
                var className = proName.toLowerCase();
                var subElement = $("> ." + className, jelement);
                //忽略
                if ($.inArray(proName, config.ignores.split(',')) != -1) continue;
                //判断子节点 (复杂属性) 
                if (subElement.length)
                {
                    var defaultName = e.controlName + "_" + proName;
                    var subDefaults = g.defaults[defaultName] || zoe.defaults[defaultName], subConfig = config[proName];
                    if (typeof (subDefaults) == "string") subDefaults = g.parseDefault(subDefaults);
                    else if (typeof (subDefaults) == "funcion") subDefaults = subDefaults();
                    if (typeof (subConfig) == "string") subConfig = g.parse(subConfig);
                    else if (typeof (subConfig) == "funcion") subConfig = subConfig();
                    if (subDefaults)
                    {
                        if ($.inArray(proName, config.arrays.split(',')) != -1)
                        {
                            value = [];
                            $(">div,>li,>input", subElement).each(function ()
                            {
                                value.push(g.getOptions({
                                    defaults: subDefaults,
                                    controlName: e.controlName,
                                    config: subConfig,
                                    jelement: $(this)
                                }));
                            });
                            options[proName] = value;
                        } else
                        {
                            options[proName] = g.getOptions({
                                defaults: subDefaults,
                                controlName: e.controlName,
                                config: subConfig,
                                jelement: subElement
                            });
                        }
                    }
                    subElement.remove();
                }
                    //动态值
                else if ($.inArray(proName, config.dynamics.split(',')) != -1 || proName.indexOf('on') == 0)
                {
                    value = g.parse(jelement.attr("data-" + proName) || jelement.attr(proName));
                    if (value)
                    {
                        options[proName] = g.fotmatValue(value, typeof (defaults[proName]));
                    }
                }
                    //默认处理
                else
                {
                    value = jelement.attr("data-" + proName) || jelement.attr(proName);
                    if (value)
                    {
                        options[proName] = g.fotmatValue(value, typeof (defaults[proName]));
                    }
                }
            }
            var dataOptions = jelement.attr("data-options") || jelement.attr("data-property");
            if (dataOptions) dataOptions = g.parse("{" + dataOptions + "}");
            if (dataOptions) $.extend(options, dataOptions);
            return options;
        },

        init: function ()
        {
            var g = this, configs = this.config;
            for (var name in g.defaults)
            {
                if (typeof (g.defaults[name]) == "string")
                {
                    g.defaults[name] = g.parseDefault(g.defaults[name]);
                }
            }
            for (var controlName in zoe.controls)
            {
                var config = configs[controlName] || {};
                var className = g.prev + controlName.toLowerCase();
                $("." + className).each(function ()
                {
                    var jelement = $(this), value;
                    var defaults = $.extend({
                        onrender: null,
                        onrendered: null
                    }, zoe.defaults[controlName]);
                    var options = g.getOptions({
                        defaults: defaults,
                        controlName: controlName,
                        config: config,
                        jelement: jelement
                    });
                    jelement[zoe.pluginPrev + controlName](options);
                });
            }
        }

    }

    $(function ()
    {
        zoe.inject.init();
    });

})(jQuery);﻿


/**
* jQuery zoeUI 1.0.0
*
* 
* Accordion 部件
*/
(function ($)
{
    $.fn.zoeAccordion = function (options)
    {
        return $.zoeui.run.call(this, "zoeAccordion", arguments);
    };

    $.fn.zoeGetAccordionManager = function ()
    {
        return $.zoeui.get(this);
    };

    $.zoeDefaults.Accordion = {
        height: null,
        speed: "normal",
        changeHeightOnResize: false,
        heightDiff: 0 // 高度补差  
    };
    $.zoeMethos.Accordion = {};

    $.zoeui.controls.Accordion = function (element, options)
    {
        $.zoeui.controls.Accordion.base.constructor.call(this, element, options);
    };
    $.zoeui.controls.Accordion.zoeExtend($.zoeui.core.UIComponent, {
        __getType: function ()
        {
            return 'Accordion';
        },
        __idPrev: function ()
        {
            return 'Accordion';
        },
        _extendMethods: function ()
        {
            return $.zoeMethos.Accordion;
        },
        _render: function ()
        {
            var g = this, p = this.options;
            g.accordion = $(g.element);
            if (!g.accordion.hasClass("l-accordion-panel")) g.accordion.addClass("l-accordion-panel");
            var selectedIndex = 0;
            if ($("> div[lselected=true]", g.accordion).length > 0)
                selectedIndex = $("> div", g.accordion).index($("> div[lselected=true]", g.accordion));

            $("> div", g.accordion).each(function (i, box)
            {
                var header = $('<div class="l-accordion-header"><div class="l-accordion-toggle"></div><div class="l-accordion-header-inner"></div></div>');
                if (i == selectedIndex)
                    $(".l-accordion-toggle", header).addClass("l-accordion-toggle-open");
                if ($(box).attr("title"))
                {
                    $(".l-accordion-header-inner", header).html($(box).attr("title"));
                    $(box).attr("title", "");
                }
                $(box).before(header);
                if (!$(box).hasClass("l-accordion-content")) $(box).addClass("l-accordion-content");
            });
            $(".l-accordion-header", g.accordion).removeClass("l-accordion-header-downfirst");
            $(".l-accordion-content:visible", g.accordion).next(".l-accordion-header:first").addClass("l-accordion-header-downfirst");

            //add Even
            $(".l-accordion-toggle", g.accordion).each(function ()
            {
                if (!$(this).hasClass("l-accordion-toggle-open") && !$(this).hasClass("l-accordion-toggle-close"))
                {
                    $(this).addClass("l-accordion-toggle-close");
                }
                if ($(this).hasClass("l-accordion-toggle-close"))
                {
                    $(this).parent().next(".l-accordion-content:visible").hide();
                }
            });
            $(".l-accordion-header", g.accordion).hover(function ()
            {
                $(this).addClass("l-accordion-header-over");
            }, function ()
            {
                $(this).removeClass("l-accordion-header-over");
            });
            $(".l-accordion-toggle", g.accordion).hover(function ()
            {
                if ($(this).hasClass("l-accordion-toggle-open"))
                    $(this).addClass("l-accordion-toggle-open-over");
                else if ($(this).hasClass("l-accordion-toggle-close"))
                    $(this).addClass("l-accordion-toggle-close-over");
            }, function ()
            {
                if ($(this).hasClass("l-accordion-toggle-open"))
                    $(this).removeClass("l-accordion-toggle-open-over");
                else if ($(this).hasClass("l-accordion-toggle-close"))
                    $(this).removeClass("l-accordion-toggle-close-over");
            });
            $(">.l-accordion-header", g.accordion).click(function ()
            {
                var togglebtn = $(".l-accordion-toggle:first", this);
                if (togglebtn.hasClass("l-accordion-toggle-close"))
                {
                    togglebtn.removeClass("l-accordion-toggle-close")
                    .removeClass("l-accordion-toggle-close-over l-accordion-toggle-open-over")
                    togglebtn.addClass("l-accordion-toggle-open");
                    $(this).next(".l-accordion-content")
                    .show(p.speed)
                    .siblings(".l-accordion-content:visible").hide(p.speed);
                    $(this).siblings(".l-accordion-header").find(".l-accordion-toggle").removeClass("l-accordion-toggle-open").addClass("l-accordion-toggle-close");
                }
                else
                {
                    togglebtn.removeClass("l-accordion-toggle-open")
                    .removeClass("l-accordion-toggle-close-over l-accordion-toggle-open-over")
                    .addClass("l-accordion-toggle-close");
                    $(this).next(".l-accordion-content").hide(p.speed);
                }
                $(".l-accordion-header", g.accordion).removeClass("l-accordion-header-downfirst");
                $(".l-accordion-content:visible", g.accordion).next(".l-accordion-header:first").addClass("l-accordion-header-downfirst");
            });
            //init
            g.headerHoldHeight = 0;
            $("> .l-accordion-header", g.accordion).each(function ()
            {
                g.headerHoldHeight += $(this).height();
            });
            if (p.height && typeof (p.height) == 'string' && p.height.indexOf('%') > 0)
            {
                g.onResize();
                if (p.changeHeightOnResize)
                {
                    $(window).resize(function ()
                    {
                        g.onResize();
                    });
                }
            }
            else
            {
                if (p.height)
                {
                    g.height = p.heightDiff + p.height;
                    g.accordion.height(g.height);
                    g.setHeight(p.height);
                }
                else
                {
                    g.header = g.accordion.height();
                }
            }

            g.set(p);
        },
        onResize: function ()
        {
            var g = this, p = this.options;
            if (!p.height || typeof (p.height) != 'string' || p.height.indexOf('%') == -1) return false;
            //set accordion height
            if (g.accordion.parent()[0].tagName.toLowerCase() == "body")
            {
                var windowHeight = $(window).height();
                windowHeight -= parseInt(g.layout.parent().css('paddingTop'));
                windowHeight -= parseInt(g.layout.parent().css('paddingBottom'));
                g.height = p.heightDiff + windowHeight * parseFloat(g.height) * 0.01;
            }
            else
            {
                g.height = p.heightDiff + (g.accordion.parent().height() * parseFloat(p.height) * 0.01);
            }
            g.accordion.height(g.height);
            g.setContentHeight(g.height - g.headerHoldHeight);
        },
        setHeight: function (height)
        {
            var g = this, p = this.options;
            g.accordion.height(height);
            height -= g.headerHoldHeight;
            $("> .l-accordion-content", g.accordion).height(height);
        }
    });


})(jQuery);﻿


/**
* jQuery zoeUI 1.0.0
* 
* 
* Button 部件
*/
(function ($)
{

    $.fn.zoeButton = function (options)
    {
        return $.zoeui.run.call(this, "zoeButton", arguments);
    };
    $.fn.zoeGetButtonManager = function ()
    {
        return $.zoeui.run.call(this, "zoeGetButtonManager", arguments);
    };

    $.zoeDefaults.Button = {
        width: 60,
        text: 'Button',
        disabled: false,
        click: null,
        icon : null
    };

    $.zoeMethos.Button = {};

    $.zoeui.controls.Button = function (element, options)
    {
        $.zoeui.controls.Button.base.constructor.call(this, element, options);
    };
    $.zoeui.controls.Button.zoeExtend($.zoeui.controls.Input, {
        __getType: function ()
        {
            return 'Button';
        },
        __idPrev: function ()
        {
            return 'Button';
        },
        _extendMethods: function ()
        {
            return $.zoeMethos.Button;
        },
        _render: function ()
        {
            var g = this, p = this.options;
            g.button = $(g.element);
            g.button.addClass("l-button");
            g.button.append('<div class="l-button-l"></div><div class="l-button-r"></div><span></span>');
            g.button.hover(function () {
                if (p.disabled) return;
                g.button.addClass("l-button-over");
            }, function () {
                if (p.disabled) return;
                g.button.removeClass("l-button-over");
            });
            p.click && g.button.click(function ()
            {
                if (!p.disabled)
                    p.click();
            });
            g.set(p);
        },
        _setIcon : function(url)
        {
            var g = this;
            if (!url)
            {
                g.button.removeClass("l-button-hasicon");
                g.button.find('img').remove();
            } else
            {
                g.button.addClass("l-button-hasicon");
                g.button.append('<img src="' + url + '" />');
            }
        },
        _setEnabled: function (value)
        {
            if (value)
                this.button.removeClass("l-button-disabled");
        },
        _setDisabled: function (value)
        {
            if (value) {
                this.button.addClass("l-button-disabled");
                this.options.disabled = true;
            } else {
                this.button.removeClass("l-button-disabled");
                this.options.disabled = false;
            }
        },
        _setWidth: function (value)
        {
            this.button.width(value);
        },
        _setText: function (value)
        {
            $("span", this.button).html(value);
        },
        setValue: function (value)
        {
            this.set('text', value);
        },
        getValue: function ()
        {
            return this.options.text;
        },
        setEnabled: function ()
        {
            this.set('disabled', false);
        },
        setDisabled: function ()
        {
            this.set('disabled', true);
        }
    }); 


})(jQuery);﻿/**
* jQuery zoeUI 1.0.0
* 
* 
*  
* 
* 
*/
(function ($)
{
    $.fn.zoeCheckBox = function (options)
    {
        return $.zoeui.run.call(this, "zoeCheckBox", arguments);
    };
    $.fn.zoeGetCheckBoxManager = function ()
    {
        return $.zoeui.run.call(this, "zoeGetCheckBoxManager", arguments);
    };
    $.zoeDefaults.CheckBox = {
        disabled: false,
        readonly : false //只读
    };

    $.zoeMethos.CheckBox = {};

    $.zoeui.controls.CheckBox = function (element, options)
    {
        $.zoeui.controls.CheckBox.base.constructor.call(this, element, options);
    };
    $.zoeui.controls.CheckBox.zoeExtend($.zoeui.controls.Input, {
        __getType: function ()
        {
            return 'CheckBox';
        },
        __idPrev: function ()
        {
            return 'CheckBox';
        },
        _extendMethods: function ()
        {
            return $.zoeMethos.CheckBox;
        },
        _render: function ()
        {
            var g = this, p = this.options;
            g.input = $(g.element);
            g.link = $('<a class="l-checkbox"></a>');
            g.wrapper = g.input.addClass('l-hidden').wrap('<div class="l-checkbox-wrapper"></div>').parent();
            g.wrapper.prepend(g.link);
            g.link.click(function ()
            {
                if (g.input.attr('disabled') || g.input.attr('readonly')) { return false; }
                if (p.disabled || p.readonly) return false;
                if (g.trigger('beforeClick', [g.element]) == false) return false; 
                if ($(this).hasClass("l-checkbox-checked"))
                {
                    g._setValue(false);
                }
                else
                {
                    g._setValue(true);
                }
                g.input.trigger("change");
            });
            g.wrapper.hover(function ()
            {
                if (!p.disabled)
                    $(this).addClass("l-over");
            }, function ()
            {
                $(this).removeClass("l-over");
            });
            this.set(p);
            this.updateStyle();
        },
        _setCss: function (value)
        {
            this.wrapper.css(value);
        },
        _setValue: function (value)
        {
            var g = this, p = this.options;
            if (!value)
            {
                g.input[0].checked = false;
                g.link.removeClass('l-checkbox-checked');
            }
            else
            {
                g.input[0].checked = true;
                g.link.addClass('l-checkbox-checked');
            }
        },
        _setDisabled: function (value)
        {
            if (value)
            {
                this.input.attr('disabled', true);
                this.wrapper.addClass("l-disabled");
            }
            else
            {
                this.input.attr('disabled', false);
                this.wrapper.removeClass("l-disabled");
            }
        },
        _getValue: function ()
        {
            return this.element.checked;
        },
        updateStyle: function ()
        {
            if (this.input.attr('disabled'))
            {
                this.wrapper.addClass("l-disabled");
                this.options.disabled = true;
            }
            if (this.input[0].checked)
            {
                this.link.addClass('l-checkbox-checked');
            }
            else
            {
                this.link.removeClass('l-checkbox-checked');
            }
        }
    });
})(jQuery);﻿/**
* jQuery zoeUI 1.0.0
* 
* zoeCheckBoxList
*/
(function ($)
{

    $.fn.zoeCheckBoxList = function (options)
    {
        return $.zoeui.run.call(this, "zoeCheckBoxList", arguments);
    }; 

    $.fn.zoeGetCheckBoxListManager = function ()
    {
        return $.zoeui.run.call(this, "zoeGetCheckBoxListManager", arguments);
    };

    $.zoeDefaults.CheckBoxList = {  
        rowSize: 3,            //每行显示元素数   
        valueField: 'id',       //值成员
        textField: 'text',      //显示成员 
        valueFieldID:null,      //隐藏域
        name : null,            //表单名
        split: ";",             //分隔符
        data: null,             //数据  
        parms: null,            //ajax提交表单 
        url: null,              //数据源URL(需返回JSON)
        onSuccess: null,
        onError: null,  
        css: null,               //附加css  
        value: null,            //值 
        valueFieldCssClass : null
    };

    //扩展方法
    $.zoeMethos.CheckBoxList = $.zoeMethos.CheckBoxList || {};


    $.zoeui.controls.CheckBoxList = function (element, options)
    {
        $.zoeui.controls.CheckBoxList.base.constructor.call(this, element, options);
    };
    $.zoeui.controls.CheckBoxList.zoeExtend($.zoeui.controls.Input, {
        __getType: function ()
        {
            return 'CheckBoxList';
        },
        _extendMethods: function ()
        {
            return $.zoeMethos.CheckBoxList;
        },
        _init: function ()
        {
            $.zoeui.controls.CheckBoxList.base._init.call(this); 
        },
        _render: function ()
        {
            var g = this, p = this.options; 
            g.data = p.data;    
            g.valueField = null; //隐藏域(保存值) 
               
            if (p.valueFieldID)
            {
                g.valueField = $("#" + p.valueFieldID + ":input,[name=" + p.valueFieldID + "]:input");
                if (g.valueField.length == 0) g.valueField = $('<input type="hidden"/>');
                g.valueField[0].id = g.valueField[0].name = p.valueFieldID;
            }
            else
            {
                g.valueField = $('<input type="hidden"/>');
                g.valueField[0].id = g.valueField[0].name = g.id + "_val";
            }
            if (g.valueField[0].name == null) g.valueField[0].name = g.valueField[0].id;
            if (p.valueFieldCssClass)
            {
                g.valueField.addClass(p.valueFieldCssClass);
            }
            g.valueField.attr("data-zoeid", g.id);
            g.checkboxList = $(this.element);
            g.checkboxList.html('<div class="l-checkboxlist-inner"><table cellpadding="0" cellspacing="0" border="0" class="l-checkboxlist-table"></table></div>').addClass("l-checkboxlist").append(g.valueField);
            g.checkboxList.table = $("table:first", g.checkboxList); 
              
            g.set(p); 

            g._addClickEven();
        },
        destroy: function ()
        { 
            if (this.checkboxList) this.checkboxList.remove();
            this.options = null;
            $.zoeui.remove(this);
        },
        clear : function()
        {
            this._changeValue("");
            this.trigger('clear');
        }, 
        _setCss : function(css)
        {
            if (css) {
                this.checkboxList.addClass(css);
            } 
        }, 
        _setDisabled: function (value)
        {
            //禁用样式
            if (value)
            {
                this.checkboxList.addClass('l-checkboxlist-disabled');
                $("input:checkbox", this.radioList).attr("disabled", true);

            } else
            {
                this.checkboxList.removeClass('l-checkboxlist-disabled');
                $("input:checkbox", this.radioList).removeAttr("disabled");
            }
        }, 
        _setWidth: function (value)
        {
            this.checkboxList.width(value);
        },
        _setHeight: function (value)
        {
            this.checkboxList.height(value);
        },  
        indexOf : function(item)
        {
            var g = this, p = this.options;
            if (!g.data) return -1;
            for (var i = 0, l = g.data.length; i < l; i++)
            {
                if (typeof (item) == "object")
                {
                    if (g.data[i] == item) return i;
                } else
                {
                    if (g.data[i][p.valueField].toString() == item.toString()) return i;
                }
            }
            return -1;
        },
        removeItems : function(items)
        {
            var g = this;
            if (!g.data) return;
            $(items).each(function (i,item)
            {
                var index = g.indexOf(item);
                if (index == -1) return;
                g.data.splice(index, 1);
            });
            g.refresh();
        },
        removeItem: function (item)
        {
            if (!this.data) return;
            var index = this.indexOf(item);
            if (index == -1) return;
            this.data.splice(index, 1);
            this.refresh();
        },
        insertItem: function (item,index)
        {
            var g = this;
            if (!g.data) g.data = []; 
            g.data.splice(index, 0, item);
            g.refresh();
        },
        addItems: function (items)
        {
            var g = this;
            if (!g.data) g.data = [];
            $(items).each(function (i, item)
            {
                g.data.push(item);
            });
            g.refresh();
        },
        addItem: function (item)
        {
            var g = this;
            if (!g.data) g.data = [];
            g.data.push(item);
            g.refresh();
        },  
        _setValue: function (value)
        {
            var g = this, p = this.options; 
            p.value = value;
            g.valueField.val(p.value);
            this._dataInit();
        },
        setValue: function (value)
        { 
            this._setValue(value);
        }, 
        _setUrl: function (url) {
            if (!url) return;
            var g = this, p = this.options;
            var parms = $.isFunction(p.parms) ? p.parms() : p.parms;
            $.ajax({
                type: 'post',
                url: url,
                data: parms,
                cache: false,
                dataType: 'json',
                success: function (data) { 
                    g.setData(data);
                    g.trigger('success', [data]);
                },
                error: function (XMLHttpRequest, textStatus) {
                    g.trigger('error', [XMLHttpRequest, textStatus]);
                }
            });
        },
        setUrl: function (url) {
            return this._setUrl(url);
        },
        setParm: function (name, value) {
            if (!name) return;
            var g = this;
            var parms = g.get('parms');
            if (!parms) parms = {};
            parms[name] = value;
            g.set('parms', parms); 
        },
        clearContent: function ()
        {
            var g = this, p = this.options;
            $("table", g.checkboxList).html(""); 
        }, 
        _setData : function(data)
        {
            this.setData(data);
        },
        setData: function (data)
        {
            var g = this, p = this.options; 
            if (!data || !data.length) return;
            g.data = data;
            g.refresh();
            g.updateStyle();
        },
        refresh:function()
        {
            var g = this, p = this.options, data = this.data; 
            this.clearContent();
            if (!data) return; 
            var out = [], rowSize = p.rowSize, appendRowStart = false, name = p.name || g.id;
            for (var i = 0; i < data.length; i++)
            {
                var val = data[i][p.valueField], txt = data[i][p.textField], id = g.id + "-" + i;
                var newRow = i % rowSize == 0;
                //0,5,10
                if (newRow)
                {
                    if (appendRowStart) out.push('</tr>'); 
                    out.push("<tr>");
                    appendRowStart = true;
                }
                out.push("<td><input type='checkbox' name='" + name + "' value='" + val + "' id='" + id + "'/><label for='" + id + "'>" + txt + "</label></td>");
            }
            if (appendRowStart) out.push('</tr>');
            g.checkboxList.table.append(out.join(''));
        },
        _getValue: function ()
        { 
            var g = this, p = this.options, name = p.name || g.id;
            var values = [];
            $('input:checkbox[name="' + name + '"]:checked').each(function ()
            {
                values.push(this.value);
            });
            if (!values.length) return null;
            return values.join(p.split);
        },
        getValue: function ()
        {
            //获取值
            return this._getValue();
        },  
        updateStyle: function ()
        {
            this._dataInit();
        },
        _dataInit: function ()
        {
            var g = this, p = this.options; 
            var value = g.valueField.val();
            g._changeValue(value);
        },
        //设置值到 隐藏域
        _changeValue: function (value)
        {
            var g = this, p = this.options, name = p.name || g.id;
            var valueArr = value ? value.split(p.split) : [];
            $("input:checkbox[name='" + name + "']", g.checkboxList).each(function ()
            { 
                this.checked = $.inArray(this.value, valueArr) > -1;
            });
            g.valueField.val(value);
            g.selectedValue = value;
        },
        _addClickEven: function ()
        {
            var g = this, p = this.options;
            //选项点击
            g.checkboxList.click(function (e)
            {  
                var value = g.getValue(); 
                if (value) g.valueField.val(value);
            });
        } 
    });
      

})(jQuery);﻿

/**
* jQuery zoeUI 1.0.0
*  
* zoeComboBox 下拉组件
* 
*/
(function ($)
{

    $.fn.zoeComboBox = function (options)
{
        return $.zoeui.run.call(this, "zoeComboBox", arguments);
    };

    $.fn.zoeGetComboBoxManager = function ()
{
        return $.zoeui.run.call(this, "zoeGetComboBoxManager", arguments);
    };

    $.zoeDefaults.ComboBox = {
        resize: true,           //是否调整大小
        isMultiSelect: false,   //是否多选
        isShowCheckBox: false,  //是否选择复选框
        columns: null,       //表格状态
        selectBoxWidth: null, //宽度
        selectBoxHeight: 120, //高度
        onBeforeSelect: false, //选择前事件
        onSelected: null, //选择值事件 
        initValue: null,
        initText: null,
        valueField: 'id',
        textField: 'text',
        valueFieldID: null,
        slide: false,           //是否以动画的形式显示
        split: ";",
        data: null,
        tree: null,            //下拉框以树的形式显示，tree的参数跟zoeTree的参数一致 
        treeLeafOnly: true,   //是否只选择叶子
        condition: null,       //列表条件搜索 参数同 zoeForm
        grid: null,              //表格 参数同 zoeGrid
        onStartResize: null,
        onEndResize: null,
        hideOnLoseFocus: true,
        hideGridOnLoseFocus: false,
        url: null,              //数据源URL(需返回JSON)
        emptyText: null,       //空行
        addRowButton: '新增',           //新增按钮
        addRowButtonClick: null,        //新增事件
        triggerIcon: null,         //
        onSuccess: null,
        onError: null,
        onBeforeOpen: null,      //打开下拉框前事件，可以通过return false来阻止继续操作，利用这个参数可以用来调用其他函数，比如打开一个新窗口来选择值
        dblClickCombobox:false,  //编辑状态，是否支持双击下拉框
        onAfterOpen:null,      //双击下拉框后事件，可以通过return false来阻止继续操作       
        onButtonClick: null,      //右侧图标按钮事件，可以通过return false来阻止继续操作，利用这个参数可以用来调用其他函数，比如打开一个新窗口来选择值
        render: null,            //文本框显示html函数
        absolute: true,         //选择框是否在附加到body,并绝对定位
        cancelable: true,      //可取消选择
        css: null,            //附加css
        parms: null,         //ajax提交表单 
        renderItem: null,   //选项自定义函数
        autocomplete: false,  //自动完成 
        highLight: false,    //自动完成是否匹配字符高亮显示
        autoSpellCode:true,  //自动完成是否匹配字符拼音或者拼音缩写, spellCode为data里的一个值
        readonly: false,              //是否只读
        ajaxType: 'post',
        alwayShowInTop: false,      //下拉框是否一直显示在上方
        isResize: false,     //下拉框是否可以调整大小
        autoWidth: false,
        valueFieldCssClass: null,
        keySupport: false,              //按键支持： 上、下、回车
        isDataNull:true,            //当数据空时是否提示
        dataNullMess:'暂无数据',         //当数据空时是否提示
        clickEve:null   //点击回调
    };

    $.zoeDefaults.ComboBoxString = {
        Search: "搜索"
    };

    //扩展方法
    $.zoeMethos.ComboBox = $.zoeMethos.ComboBox || {};


    $.zoeui.controls.ComboBox = function (element, options)
{
        $.zoeui.controls.ComboBox.base.constructor.call(this, element, options);
    };
    $.zoeui.controls.ComboBox.zoeExtend($.zoeui.controls.Input, {
        __getType: function ()
{
            return 'ComboBox';
        },
        _extendMethods: function ()
{
            return $.zoeMethos.ComboBox;
        },
        _init: function ()
{
            $.zoeui.controls.ComboBox.base._init.call(this);
            var p = this.options;
            if (p.columns)
{
                p.isShowCheckBox = true;
            }
            if (p.isMultiSelect)
{
                p.isShowCheckBox = true;
            }
        },
        _render: function ()
{
            var g = this, p = this.options;
            g.data = p.data;
            g.inputText = null;
            g.select = null;
            g.textFieldID = "";
            g.valueFieldID = "";
            g.valueField = null; //隐藏域(保存值) 
            //文本框初始化
            if (this.element.tagName.toLowerCase() == "input")
{
                this.element.readOnly = true;
                g.inputText = $(this.element);
                g.textFieldID = this.element.id;
            }
            else if (this.element.tagName.toLowerCase() == "select")
{
                $(this.element).hide();
                g.select = $(this.element);
                p.isMultiSelect = false;
                p.isShowCheckBox = false;
                p.cancelable = false;
                g.textFieldID = this.element.id + "_txt";
                g.inputText = $('<input type="text" readonly="true"/>');
                g.inputText.attr("id", g.textFieldID).insertAfter($(this.element));
            }
            if (g.inputText[0].name == undefined) g.inputText[0].name = g.textFieldID;
            //隐藏域初始化
            g.valueField = null;
            g.inputText.attr("data-comboboxid", g.id);
            if (p.valueFieldID)
{
                g.valueField = $("#" + p.valueFieldID + ":input,[name=" + p.valueFieldID + "]:input").filter("input:hidden");
                if (g.valueField.length == 0) g.valueField = $('<input type="hidden"/>');
                g.valueField[0].id = g.valueField[0].name = p.valueFieldID;
            }
            else
{
                g.valueField = $('<input type="hidden"/>');
                g.valueField[0].id = g.valueField[0].name = g.textFieldID + "_val";
            }
            if (p.valueFieldCssClass)
{
                g.valueField.addClass(p.valueFieldCssClass);
            }
            if (g.valueField[0].name == undefined) g.valueField[0].name = g.valueField[0].id;
            //update by superzoc 增加初始值
            if (p.initValue != null) g.valueField[0].value = p.initValue;
            g.valueField.attr("data-zoeid", g.id);
            //开关
            g.link = $('<div class="l-trigger"><div class="l-trigger-icon"></div></div>');
            if (p.triggerIcon) g.link.find("div:first").addClass(p.triggerIcon);
            //下拉框
            g.selectBox = $('<div class="l-box-select" style="display:none"><div class="l-box-select-inner"><table cellpadding="0" cellspacing="0" border="0" class="l-box-select-table"></table></div></div>');
            g.selectBox.table = $("table:first", g.selectBox);
            g.selectBoxInner = g.selectBox.find(".l-box-select-inner:first");
            //外层
            g.wrapper = g.inputText.wrap('<div class="l-text l-text-combobox"></div>').parent();
            g.wrapper.append('<div class="l-text-l"></div><div class="l-text-r"></div>');
            g.wrapper.append(g.link);
            //添加个包裹，
            g.textwrapper = g.wrapper.wrap('<div class="l-text-wrapper"></div>').parent();

            if (p.absolute)
                g.selectBox.appendTo('body').addClass("l-box-select-absolute");
            else
                g.textwrapper.append(g.selectBox);

            g.textwrapper.append(g.valueField);
            g.inputText.addClass("l-text-field");
            if (p.isShowCheckBox && !g.select)
{
                $("table", g.selectBox).addClass("l-table-checkbox");
            } else
{
                p.isShowCheckBox = false;
                $("table", g.selectBox).addClass("l-table-nocheckbox");
            }
            //开关 事件
            g.link.hover(function ()
{
                if (p.disabled || p.readonly) return;
                this.className = "l-trigger-hover";
            }, function ()
{
                if (p.disabled || p.readonly) return;
                this.className = "l-trigger";
            }).mousedown(function ()
{
                if (p.disabled || p.readonly) return;
                this.className = "l-trigger-pressed";
            }).mouseup(function ()
{
                if (p.disabled || p.readonly) return;
                this.className = "l-trigger-hover";
            }).click(function ()
{
                if (p.disabled || p.readonly) return;
                if (g.trigger('buttonClick') == false) return false;
                if (g.trigger('beforeOpen') == false) return false;
                g._setWidth();
                g._toggleSelectBox(g.selectBox.is(":visible"));
            });
            if(p.dblClickCombobox){
                 g.inputText.dblclick(function (){
                    if (g.trigger('afterOpen') == false) return false;
                });
            }
            g.inputText.click(function ()
{
                if (p.disabled || p.readonly) return;
                if (g.trigger('beforeOpen') == false) return false;
                g._setWidth();
                g._toggleSelectBox(g.selectBox.is(":visible"));
               if($.isFunction(p.clickEve)){
                    p.clickEve();
               }

            }).blur(function ()
{
                if (p.disabled) return;
                g.wrapper.removeClass("l-text-focus");
            }).focus(function ()
{
                if (p.disabled || p.readonly) return;
                g.wrapper.addClass("l-text-focus");
            });
            g.wrapper.hover(function ()
{
                if (p.disabled || p.readonly) return;
                g.wrapper.addClass("l-text-over");
            }, function ()
{
                if (p.disabled || p.readonly) return;
                g.wrapper.removeClass("l-text-over");
            });
            g.resizing = false;
            g.selectBox.hover(null, function (e)
{
                if (p.hideOnLoseFocus && g.selectBox.is(":visible") && !g.boxToggling && !g.resizing)
{
                    g._toggleSelectBox(true);
                }
            });
            //下拉框内容初始化
            g.bulidContent();

            g.set(p);
            //下拉框宽度、高度初始化   
            if (p.selectBoxWidth)
{
                g.selectBox.width(p.selectBoxWidth);
            }
            else
{
                g.selectBox.css('width', g.wrapper.css('width'));
            }
            if (p.grid)
            {
                g.bind('show', function ()
                {
                    if (!g.grid)
                    {
                        g.setGrid(p.grid);
                        g.set('SelectBoxHeight', p.selectBoxHeight);
                    }
                });
            }
            g.updateSelectBoxPosition();
            $(document).bind("click.combobox", function (e)
{
                //修改点击空白处隐藏下拉框功能
                if (g.selectBox.is(":visible") && $((e.target || e.srcElement)).closest(".l-box-select, .l-text-combobox").length == 0)
{
                    g._toggleSelectBox(true);
                }
            });
        },
        destroy: function ()
{
            if (this.wrapper) this.wrapper.remove();
            if (this.selectBox) this.selectBox.remove();
            this.options = null;
            $.zoeui.remove(this);
        },
        clear: function ()
{
            this._changeValue("", "");
            $("a.l-checkbox-checked", this.selectBox).removeClass("l-checkbox-checked");
            $("td.l-selected", this.selectBox).removeClass("l-selected");
            $(":checkbox", this.selectBox).each(function () { this.checked = false; });
            this.trigger('clear');
        },
        _setSelectBoxHeight: function (height)
{
            if (!height) return;
            var g = this, p = this.options;
            if (p.grid)
            {
                g.grid && g.grid.set('height', g.getGridHeight(height));
            } else if (!p.tree)
{
                var itemsleng = $("tr", g.selectBox.table).length;
                if (!p.selectBoxHeight && itemsleng < 8) p.selectBoxHeight = itemsleng * 30;
                if (p.selectBoxHeight)
{
                    if (itemsleng < 8)
{
                        g.selectBoxInner.height('auto');
                    } else
{
                        g.selectBoxInner.height(p.selectBoxHeight);
                    }
                }
            }
        },
        _setCss: function (css)
{
            if (css)
            {
                this.wrapper.addClass(css);
            }
        },
        //取消选择 
        _setCancelable: function (value)
{
            var g = this, p = this.options;
            if (!value && g.unselect)
            {
                g.unselect.remove();
                g.unselect = null;
            }
            if (!value && !g.unselect) return;
            g.unselect = $('<div class="l-trigger l-trigger-cancel"><div class="l-trigger-icon"></div></div>').hide();
            g.wrapper.hover(function ()
            {
                g.unselect.show();
            }, function ()
            {
                g.unselect.hide();
            })
            if (!p.disabled && !p.readonly && p.cancelable)
            {
                g.wrapper.append(g.unselect);
            }
            g.unselect.hover(function ()
            {
                this.className = "l-trigger-hover l-trigger-cancel";
            }, function ()
            {
                this.className = "l-trigger l-trigger-cancel";
            }).click(function ()
            {
                g.clear();
            });
        },
        _setDisabled: function (value)
{
            //禁用样式
            if (value)
{
                this.wrapper.addClass('l-text-disabled');
            } else
{
                this.wrapper.removeClass('l-text-disabled');
            }
        },
        _setReadonly: function (readonly)
{
            if (readonly)
{
                this.wrapper.addClass("l-text-readonly");
            } else
{
                this.wrapper.removeClass("l-text-readonly");
            }
        },
        _setLable: function (label)
{
            var g = this, p = this.options;
            if (label)
{
                if (g.labelwrapper)
{
                    g.labelwrapper.find(".l-text-label:first").html(label + ':&nbsp');
                }
                else
{
                    g.labelwrapper = g.textwrapper.wrap('<div class="l-labeltext"></div>').parent();
                    g.labelwrapper.prepend('<div class="l-text-label" style="float:left;display:inline;">' + label + ':&nbsp</div>');
                    g.textwrapper.css('float', 'left');
                }
                if (!p.labelWidth)
{
                    p.labelWidth = $('.l-text-label', g.labelwrapper).outerWidth();
                }
                else
{
                    $('.l-text-label', g.labelwrapper).outerWidth(p.labelWidth);
                }
                $('.l-text-label', g.labelwrapper).width(p.labelWidth);
                $('.l-text-label', g.labelwrapper).height(g.wrapper.height());
                g.labelwrapper.append('<br style="clear:both;" />');
                if (p.labelAlign)
{
                    $('.l-text-label', g.labelwrapper).css('text-align', p.labelAlign);
                }
                g.textwrapper.css({ display: 'inline' });
                g.labelwrapper.width(g.wrapper.outerWidth() + p.labelWidth + 2);
            }
        },
        _setWidth: function (value)
{
            var g = this, p = this.options;
            if (value > 20)
{
                g.wrapper.css({ width: value });
                g.inputText.css({ width: value - 20 });
                if (!p.selectBoxWidth)
                {
                    g.selectBox.css({ width: value });
                }
            }
            if (p.autoWidth && !p.isResize) {
                if (value == undefined) {
                    if (!p.selectBoxWidth) {
                        g.selectBox.css({ width: g.wrapper.width() - 2 });
                    }
                }
            }
        },
        _setHeight: function (value)
{
            var g = this;
            if (value > 10)
{
                g.wrapper.height(value);
                g.inputText.height(value - 2);
            }
        },
        _setResize: function (resize)
{
            var g = this, p = this.options;
            if (p.columns)
            {
                return;
            }
            //调整大小支持
            if (p.isResize && resize && $.fn.zoeResizable)
{
                var handles = p.selectBoxHeight ? 'e' : 'se,s,e';
                g.selectBox.zoeResizable({
                    handles: handles, onStartResize: function ()
                    {
                        g.resizing = true;
                        g.trigger('startResize');
                    }, onEndResize: function ()
                    {
                        g.resizing = false;
                        if (g.trigger('endResize') == false)
                            return false;
                    }, onStopResize: function (current, e)
                    {
                        if (g.grid)
                        {
                            if (current.newWidth)
                            {
                                g.selectBox.width(current.newWidth);
                            }
                            if (current.newHeight)
                            {
                                g.set({ selectBoxHeight: current.newHeight });
                            }
                            g.grid.refreshSize();
                            g.trigger('endResize');
                            return false;
                        }
                        return true;
                    }
                });
                g.selectBox.append("<div class='l-btn-nw-drop'></div>");
            }
        },
        //查找Text,适用多选和单选
        findTextByValue: function (value)
{
            var g = this, p = this.options;
            if (value == null) return "";
            var texts = "";
            var contain = function (checkvalue)
{
                var targetdata = value.toString().split(p.split);
                for (var i = 0; i < targetdata.length; i++)
{
                    if (targetdata[i] == checkvalue) return true;
                }
                return false;
            };
            //当combobox下拉一个grid时, 不能直接取data. 必须取grid的data. 
            //原写法$(g.data) 仅适用于无grid时的典型情形
            var d;
            if (g.options.grid && g.options.grid.data)
                d = g.options.grid.data.Rows;
            else
                d = g.data;
            $(d).each(function (i, item)
{
                var val = item[p.valueField];
                var txt = item[p.textField];
                if (contain(val))
{
                    texts += txt + p.split;
                }
            });
            if (texts.length > 0) texts = texts.substr(0, texts.length - 1);
            return texts;
        },
        //查找Value,适用多选和单选
        findValueByText: function (text)
{
            var g = this, p = this.options;
            if (!text && text == "") return "";
            var contain = function (checkvalue)
{
                var targetdata = text.toString().split(p.split);
                for (var i = 0; i < targetdata.length; i++)
{
                    if (targetdata[i] == checkvalue) return true;
                }
                return false;
            };
            var values = "";
            $(g.data).each(function (i, item)
{
                var val = item[p.valueField];
                var txt = item[p.textField];
                if (contain(txt))
{
                    values += val + p.split;
                }
            });
            if (values.length > 0) values = values.substr(0, values.length - 1);
            return values;
        },
        insertItem: function (data, index)
{
            var g = this, p = this.options;
            g.data = g.data || [];
            g.data.splice(index, 0, data);
            g.setData(g.data);
        },
        addItem: function (data)
{
            var g = this, p = this.options;
            g.insertItem(data, (g.data || []).length);
        },
        _setValue: function (value, text)
{
            var g = this, p = this.options;
            text = g.findTextByValue(value);
            if (p.tree)
{
                g.selectValueByTree(value);
            }
            else if (!p.isMultiSelect)
{
                g._changeValue(value, text);
                $("tr[value='" + value + "'] td", g.selectBox).addClass("l-selected");
                $("tr[value!='" + value + "'] td", g.selectBox).removeClass("l-selected");
            }
            else
{
                g._changeValue(value, text);
                if (value != null)
                {
                    var targetdata = value.toString().split(p.split);
                    g._setData(g.data);
                }
            }
        },
        selectValue: function (value)
{
            this._setValue(value);
        },
        bulidContent: function ()
{
            var g = this, p = this.options;
            this.clearContent();
            if (g.select)
{
                g.setSelect();
            }
            else if (p.tree)
{
                g.setTree(p.tree);
            }
        },
        reload: function ()
{
            var g = this, p = this.options;
            if (p.url)
{
                g.set('url', p.url);
            }
            else if (g.grid)
{
                g.grid.reload();
            }
        },
        _setUrl: function (url)
        {
            if (!url) return;
            var g = this, p = this.options;
            var parms = $.isFunction(p.parms) ? p.parms() : p.parms;
            $.ajax({
                type: p.ajaxType,
                url: url,
                data: parms,
                cache: false,
                dataType: 'json',
                success: function (data)
                {
                    g.setData(data);
                    g.trigger('success', [data]);
                },
                error: function (XMLHttpRequest, textStatus)
                {
                    g.trigger('error', [XMLHttpRequest, textStatus]);
                }
            });
        },
        setUrl: function (url)
        {
            return this._setUrl(url);
        },
        setParm: function (name, value)
        {
            if (!name) return;
            var g = this;
            var parms = g.get('parms');
            if (!parms) parms = {};
            parms[name] = value;
            g.set('parms', parms);
        },
        clearContent: function ()
{
            var g = this, p = this.options;
            $("table", g.selectBox).html("");
            //清除下拉框内容的时候重设高度
            g._setSelectBoxHeight(p.selectBoxHeight);
            //modify end
            //g.inputText.val("");
            //g.valueField.val(""); 
        },
        setSelect: function ()
{
            var g = this, p = this.options;
            this.clearContent();
            $('option', g.select).each(function (i)
{
                var val = $(this).val();
                var txt = $(this).html();
                var tr = $("<tr><td index='" + i + "' value='" + val + "' text='" + txt + "'>" + txt + "</td>");
                $("table.l-table-nocheckbox", g.selectBox).append(tr);
                $("td", tr).hover(function ()
{
                    $(this).addClass("l-over");
                }, function ()
{
                    $(this).removeClass("l-over");
                });
            });
            $('td:eq(' + g.select[0].selectedIndex + ')', g.selectBox).each(function ()
{
                if ($(this).hasClass("l-selected"))
{
                    g.selectBox.hide();
                    return;
                }
                $(".l-selected", g.selectBox).removeClass("l-selected");
                $(this).addClass("l-selected");
                if (g.select[0].selectedIndex != $(this).attr('index') && g.select[0].onchange)
{
                    g.select[0].selectedIndex = $(this).attr('index'); g.select[0].onchange();
                }
                var newIndex = parseInt($(this).attr('index'));
                g.select[0].selectedIndex = newIndex;
                g.select.trigger("change");
                g.selectBox.hide();
                var value = $(this).attr("value");
                var text = $(this).html();
                if (p.render)
{
                    g.inputText.val(p.render(value, text));
                }
                else
{
                    g.inputText.val(text);
                }
            });
            g._addClickEven();
        },
        _setData: function (data)
{
            this.setData(data);
        },
        setData: function (data)
{
            var g = this, p = this.options;
            if (g.select) return;
            if (!data || !data.length)
            {
                data = [];
                try{
	                if(p.isDataNull){
	                    data[0] = {};               
	                    data[0][p.textField] = p.dataNullMess;
	                }
	            }catch(error){
	            	return;
	            }
            }
            if (g.data != data) g.data = data;
            this.clearContent();
            if (p.columns)
{
                g.selectBox.table.headrow = $("<tr class='l-table-headerow'><td width='18px'></td></tr>");
                g.selectBox.table.append(g.selectBox.table.headrow);
                g.selectBox.table.addClass("l-box-select-grid");
                for (var j = 0; j < p.columns.length; j++)
{
                    var headrow = $("<td columnindex='" + j + "' columnname='" + p.columns[j].name + "'>" + p.columns[j].header + "</td>");
                    if (p.columns[j].width)
{
                        headrow.width(p.columns[j].width);
                    }
                    g.selectBox.table.headrow.append(headrow);

                }
            }
            var out = [];
            if (p.emptyText && !g.emptyRow && (data.length == 0 || data[0][p.textField] != p.emptyText))
{
                g.emptyRow = {};
                g.emptyRow[p.textField] = p.emptyText;
                g.emptyRow[p.valueField] = null;
                data.splice(0, 0, g.emptyRow);
            }
            for (var i = 0; i < data.length; i++)
{
                var val = data[i][p.valueField];
                var txt = data[i][p.textField];
                if (!p.columns)
{
                    out.push("<tr value='" + val + "'>");
                    if (p.isShowCheckBox)
                    {
                        out.push("<td style='width:18px;'  index='" + i + "' value='" + val + "' text='" + txt + "' ><input type='checkbox' /></td>");
                    }
                    var itemHtml = txt;
                    if (p.renderItem)
                    {
                        itemHtml = p.renderItem.call(g, {
                            data: data[i],
                            value: val,
                            text: txt,
                            key: g.inputText.val()
                        });
                    } else if (p.autocomplete && p.highLight)
{
                        itemHtml = g._highLight(txt, g.inputText.val());
                    }
                    out.push("<td index='" + i + "' value='" + val + "' text='" + txt + "' align='left'>" + itemHtml + "</td></tr>");
                } else
{
                    out.push("<tr value='" + val + "'><td style='width:18px;'  index='" + i + "' value='" + val + "' text='" + txt + "' ><input type='checkbox' /></td>");
                    for (var j = 0; j < p.columns.length; j++)
                    {
                        var columnname = p.columns[j].name;
                        out.push("<td>" + data[i][columnname] + "</td>");
                    }
                    out.push('</tr>');
                }
            }
            if (!p.columns)
            {
                if (p.isShowCheckBox)
                {
                    $("table.l-table-checkbox", g.selectBox).append(out.join(''));
                } else
                {
                    $("table.l-table-nocheckbox", g.selectBox).append(out.join(''));
                }
            } else
            {
                g.selectBox.table.append(out.join(''));
            }
            if (p.addRowButton && p.addRowButtonClick && !g.addRowButton)
{
                g.addRowButton = $('<div class="l-box-select-add"><a href="javascript:void(0)" class="link"><div class="icon"></div></a></div>');
                g.addRowButton.find(".link").append(p.addRowButton).click(p.addRowButtonClick);
                g.selectBoxInner.after(g.addRowButton);
            }
            g.set('selectBoxHeight', p.selectBoxHeight);
            //自定义复选框支持
            if (p.isShowCheckBox && $.fn.zoeCheckBox)
{
                $("table input:checkbox", g.selectBox).zoeCheckBox();
            }
            $(".l-table-checkbox input:checkbox", g.selectBox).change(function ()
{
                if (this.checked && g.hasBind('beforeSelect'))
{
                    var parentTD = null;
                    if ($(this).parent().get(0).tagName.toLowerCase() == "div")
{
                        parentTD = $(this).parent().parent();
                    } else
{
                        parentTD = $(this).parent();
                    }
                    if (parentTD != null && g.trigger('beforeSelect', [parentTD.attr("value"), parentTD.attr("text")]) == false)
{
                        g.selectBox.slideToggle("fast");
                        return false;
                    }
                }
                if (!p.isMultiSelect)
{
                    if (this.checked)
{
                        $("input:checked", g.selectBox).not(this).each(function ()
{
                            this.checked = false;
                            $(".l-checkbox-checked", $(this).parent()).removeClass("l-checkbox-checked");
                        });
                        g.selectBox.slideToggle("fast");
                    }
                }
                g._checkboxUpdateValue();
            });
            $("table.l-table-nocheckbox td", g.selectBox).hover(function ()
{
                $(this).addClass("l-over");
            }, function ()
{
                $(this).removeClass("l-over");
            });
            g._addClickEven();
            //选择项初始化
            if (!p.autocomplete)
            {
                g.updateStyle();
            }
        },
        //树
        setTree: function (tree)
{
            var g = this, p = this.options;
            this.clearContent();
            g.selectBox.table.remove();
            if (tree.checkbox != false)
{
                tree.onCheck = function ()
{
                    var nodes = g.treeManager.getChecked();
                    var value = [];
                    var text = [];
                    $(nodes).each(function (i, node)
{
                        if (p.treeLeafOnly && node.data.children) return;
                        value.push(node.data[p.valueField]);
                        text.push(node.data[p.textField]);
                    });
                    g._changeValue(value.join(p.split), text.join(p.split));
                };
            }
            else
{
                tree.onSelect = function (node)
{
                    if (g.trigger('BeforeSelect'[node]) == false) return;
                    if (p.treeLeafOnly && node.data.children) return;
                    var value = node.data[p.valueField];
                    var text = node.data[p.textField];
                    g._changeValue(value, text);
                    g.selectBox.hide();
                };
                tree.onCancelSelect = function (node)
{
                    g._changeValue("", "");
                };
            }
            tree.onAfterAppend = function (domnode, nodedata)
{
                if (!g.treeManager) return;
                var value = null;
                if (p.initValue) value = p.initValue;
                else if (g.valueField.val() != "") value = g.valueField.val();
                g.selectValueByTree(value);
            };
            g.tree = $("<ul></ul>");
            $("div:first", g.selectBox).append(g.tree);
            //新增下拉框中获取树对象的接口
            g.innerTree = g.tree.zoeTree(tree);
            g.treeManager = g.tree.zoeGetTreeManager();
        },
        //新增下拉框中获取树对象的接口
        getTree: function ()
        {
            return this.innerTree;
        },
        selectValueByTree: function (value)
{
            var g = this, p = this.options;
            if (value != null)
{
                var text = "";
                var valuelist = value.toString().split(p.split);
                $(valuelist).each(function (i, item)
{
                    g.treeManager.selectNode(item.toString());
                    text += g.treeManager.getTextByID(item);
                    if (i < valuelist.length - 1) text += p.split;
                });
                g._changeValue(value, text);
            }
        },
        //表格
        setGrid: function (grid)
{
            var g = this, p = this.options;
            if (g.grid) return;
            p.hideOnLoseFocus = p.hideGridOnLoseFocus ? true : false;
            this.clearContent();
            g.selectBox.addClass("l-box-select-lookup");
            g.selectBox.table.remove();
            var panel = $("div:first", g.selectBox);
            var conditionPanel = $("<div></div>").appendTo(panel);
            var gridPanel = $("<div></div>").appendTo(panel);
            g.conditionPanel = conditionPanel;
            //搜索框
            if (p.condition)
            {
                var conditionParm = $.extend({
                    labelWidth: 60,
                    space: 20,
                    width: p.selectBoxWidth
                }, p.condition);
                g.condition = conditionPanel.zoeForm(conditionParm);
            } else
            {
                conditionPanel.remove();
            }
            //列表
            grid = $.extend({
                columnWidth: 120,
                alternatingRow: false,
                frozen: true,
                rownumbers: true,
                allowUnSelectRow: true
            }, grid, {
                width: "100%",
                height: g.getGridHeight(),
                inWindow: false,
                parms: p.parms,
                isChecked: function (rowdata)
                {
                    var value = g.getValue();
                    if (!value) return false;
                    if (!p.valueField || !rowdata[p.valueField]) return false;
                    return $.inArray(rowdata[p.valueField].toString(), value.split(p.split)) != -1;
                }
            });
            g.grid = g.gridManager = gridPanel.zoeGrid(grid);
            g.grid.bind('afterShowData', function ()
{
                g.updateSelectBoxPosition();
            });
            var selecteds = [], onGridSelect = function ()
            {
                var value = [], text = [];
                $(selecteds).each(function (i, rowdata)
                {
                    value.push(rowdata[p.valueField]);
                    text.push(rowdata[p.textField]);
                });
                if (grid.checkbox)
                    g.selected = selecteds;
                else if (selecteds.length)
                    g.selected = selecteds[0];
                else
                    g.selected = null;
                g._changeValue(value.join(p.split), text.join(p.split));
                g.trigger('gridSelect', {
                    value: value.join(p.split),
                    text: text.join(p.split),
                    data: selecteds
                });
            }, removeSelected = function (rowdata)
            {
                for (var i = selecteds.length - 1; i >= 0; i--)
                {
                    if (selecteds[i][p.valueField] == rowdata[p.valueField])
                    {
                        selecteds.splice(i, 1);
                    }
                }
            }, addSelected = function (rowdata)
            {
                for (var i = selecteds.length - 1; i >= 0; i--)
                {
                    if (selecteds[i][p.valueField] == rowdata[p.valueField])
                    {
                        return;
                    }
                }
                selecteds.push(rowdata);
            };
            if (grid.checkbox)
{
                var onCheckRow = function (checked, rowdata)
                {
                    checked && addSelected(rowdata);
                    !checked && removeSelected(rowdata);
                };
                g.grid.bind('CheckAllRow', function (checked)
                {
                    $(g.grid.rows).each(function (i, rowdata)
                    {
                        onCheckRow(checked, rowdata);
                    });
                    onGridSelect();
                });
                g.grid.bind('CheckRow', function (checked, rowdata)
                {
                    onCheckRow(checked, rowdata);
                    onGridSelect();
                });
            }
            else
{
                g.grid.bind('SelectRow', function (rowdata)
                {
                    selecteds = [rowdata];
                    onGridSelect();
                    g._toggleSelectBox(true);
                });
                g.grid.bind('UnSelectRow', function ()
                {
                    selecteds = [];
                    onGridSelect();
                });
            }
            g.bind('show', function ()
            {
                g.grid.refreshSize();
            });
            g.bind("clear", function ()
            {
                selecteds = [];
                g.grid.selecteds = [];
                g.grid._showData();
            });
            if (p.condition)
            {
                var containerBtn1 = $('<li style="margin-right:9px"><div></div></li>');
                var containerBtn2 = $('<li style="margin-right:9px;float:right"><div></div></li>');
                $("ul:first", conditionPanel).append(containerBtn1).append(containerBtn2).after('<div class="l-clear"></div>');
                $("div", containerBtn1).zoeButton({
                    text: p.Search, width: 40,
                    click: function ()
                    {
                        var rules = g.condition.toConditions();
                        g.grid.setParm(grid.conditionParmName || 'condition', $.zoeui.toJSON(rules));
                        g.grid.reload();
                    }
                });
                $("div", containerBtn2).zoeButton({
                    text: '关闭', width: 40,
                    click: function ()
                    {
                        g.selectBox.hide();
                    }
                });
            }
            g.grid.refreshSize();
        },
        getGridHeight: function (height)
        {
            var g = this, p = this.options;
            height = height || g.selectBox.height();
            height -= g.conditionPanel.height();
            return height;
        },
        _getValue: function ()
{
            return $(this.valueField).val();
        },
        getValue: function ()
{
            //获取值
            return this._getValue();
        },
        getSelected: function ()
{
            return this.selected;
        },
        upFocus : function()
        {
            var g = this, p = this.options;
            var currentIndex = g.selectBox.table.find("td.l-over").attr("index");
            if (currentIndex == undefined || currentIndex == "0")
            {
                return;
            } 
            else
            {
                currentIndex = parseInt(currentIndex) - 1;
            } 
            g.selectBox.table.find("td.l-over").removeClass("l-over"); 
            g.selectBox.table.find("td[index=" + currentIndex + "]").addClass("l-over");

            g._scrollAdjust(currentIndex);
        },
        downFocus : function()
        {
            var g = this, p = this.options; 
            var currentIndex = g.selectBox.table.find("td.l-over").attr("index");
            if (currentIndex == g.data.length - 1) return;
            if (currentIndex == undefined)
            {
                currentIndex = 0;
            }
            else
            {
                currentIndex = parseInt(currentIndex) + 1;
            }
            g.selectBox.table.find("td.l-over").removeClass("l-over");
            g.selectBox.table.find("td[index=" + currentIndex + "]").addClass("l-over");

            g._scrollAdjust(currentIndex); 
        },

        _scrollAdjust:function(currentIndex)
        {
            var g = this, p = this.options; 
            var boxHeight = $(".l-box-select-inner", g.selectBox).height();
            var fullHeight = $(".l-box-select-inner table", g.selectBox).height();
            if (fullHeight <= boxHeight) return;
            var pageSplit = parseInt(fullHeight / boxHeight) + ((fullHeight % boxHeight) ? 1 : 0);//分割成几屏
            var itemHeight = fullHeight / g.data.length; //单位高度
            //计算出位于第几屏
            var pageCurrent = parseInt((currentIndex + 1) * itemHeight / boxHeight) + (((currentIndex + 1) * itemHeight % boxHeight) ? 1 : 0);
            $(".l-box-select-inner", g.selectBox).scrollTop((pageCurrent - 1) * boxHeight);
        },
        getText: function ()
{
            return this.inputText.val();
        },
        setText: function (value)
        {
            this.inputText.val(value);
        },
        updateStyle: function ()
{
            var g = this, p = this.options;
            p.initValue = g._getValue();
            g._dataInit();
        },
        _dataInit: function ()
{
            var g = this, p = this.options;
            var value = null;
            if (p.initValue != null && p.initText != null)
{
                g._changeValue(p.initValue, p.initText);
            }
            //根据值来初始化
            if (p.initValue != null)
{
                value = p.initValue;
                if (p.tree)
{
                    if (value)
                        g.selectValueByTree(value);
                }
                else if (g.data)
{
                    var text = g.findTextByValue(value);
                    g._changeValue(value, text);
                }
            }
            else if (g.valueField.val() != "")
{
                value = g.valueField.val();
                if (p.tree)
{
                    if (value)
                        g.selectValueByTree(value);
                }
                else if (g.data)
{
                    var text = g.findTextByValue(value);
                    g._changeValue(value, text);
                }
            }
            if (!p.isShowCheckBox)
{
                $("table tr", g.selectBox).find("td:first").each(function ()
{
                    if (value != null && value == $(this).attr("value"))
{
                        $(this).addClass("l-selected");
                    } else
{
                        $(this).removeClass("l-selected");
                    }
                });
            }
            else
{
                $(":checkbox", g.selectBox).each(function ()
{
                    var parentTD = null;
                    var checkbox = $(this);
                    if (checkbox.parent().get(0).tagName.toLowerCase() == "div")
{
                        parentTD = checkbox.parent().parent();
                    } else
{
                        parentTD = checkbox.parent();
                    }
                    if (parentTD == null) return;
                    $(".l-checkbox", parentTD).removeClass("l-checkbox-checked");
                    checkbox[0].checked = false;
                    var valuearr = (value || "").toString().split(p.split);
                    $(valuearr).each(function (i, item)
{
                        if (value != null && item == parentTD.attr("value"))
{
                            $(".l-checkbox", parentTD).addClass("l-checkbox-checked");
                            checkbox[0].checked = true;
                        }
                    });
                });
            }
        },
        //设置值到 文本框和隐藏域
        _changeValue: function (newValue, newText)
{
            var g = this, p = this.options;
            g.valueField.val(newValue);
            if (p && p.render)
{
                g.inputText.val(p.render(newValue, newText));
            }
            else
{
                g.inputText.val(newText);
            }
            g.selectedValue = newValue;
            g.selectedText = newText;
            g.inputText.trigger("change").focus();
            g.trigger('selected', [newValue, newText]);
        },
        //更新选中的值(复选框)
        _checkboxUpdateValue: function ()
{
            var g = this, p = this.options;
            var valueStr = "";
            var textStr = "";
            $("input:checked", g.selectBox).each(function ()
{
                var parentTD = null;
                if ($(this).parent().get(0).tagName.toLowerCase() == "div")
{
                    parentTD = $(this).parent().parent();
                } else
{
                    parentTD = $(this).parent();
                }
                if (!parentTD) return;
                valueStr += parentTD.attr("value") + p.split;
                textStr += parentTD.attr("text") + p.split;
            });
            if (valueStr.length > 0) valueStr = valueStr.substr(0, valueStr.length - 1);
            if (textStr.length > 0) textStr = textStr.substr(0, textStr.length - 1);
            g._changeValue(valueStr, textStr);
        },
         enabledLoadDetail : function()
        {
            var g = this, p = this.options;
            return p.detailUrl && p.detailEnabled ? true : false;
        },
        _addClickEven: function ()
{
            var g = this, p = this.options;
            //选项点击
            $(".l-table-nocheckbox td", g.selectBox).click(function ()
{
                var value = $(this).attr("value");
                var index = parseInt($(this).attr('index'));
                var text = $(this).attr("text");
                if(text==p.dataNullMess) return;
                if (g.hasBind('beforeSelect') && g.trigger('beforeSelect', [value, text]) == false)
{
                    if (p.slide) g.selectBox.slideToggle("fast");
                    else g.selectBox.hide();
                    return false;
                }
                if ($(this).hasClass("l-selected"))
{
                    if (p.slide) g.selectBox.slideToggle("fast");
                    else g.selectBox.hide();
                    return;
                }
                $(".l-selected", g.selectBox).removeClass("l-selected");
                $(this).addClass("l-selected");
                if (g.select)
{
                    if (g.select[0].selectedIndex != index)
{
                        g.select[0].selectedIndex = index;
                        g.select.trigger("change");
                    }
                }
                if (p.slide)
{
                    g.boxToggling = true;
                    g.selectBox.hide("fast", function ()
{
                        g.boxToggling = false;
                    })
                } else g.selectBox.hide();
                g._changeValue(value, text);
            });
        },
        updateSelectBoxPosition: function ()
{
            var g = this, p = this.options;
            if (p && p.absolute)
{
                var contentHeight = $(document).height();
                if (p.alwayShowInTop || Number(g.wrapper.offset().top + 1 + g.wrapper.outerHeight() + g.selectBox.height()) > contentHeight
            			&& contentHeight > Number(g.selectBox.height() + 1))
{
                    //若下拉框大小超过当前document下边框,且当前document上留白大于下拉内容高度,下拉内容向上展现
                    g.selectBox.css({ left: g.wrapper.offset().left, top: g.wrapper.offset().top - 1 - g.selectBox.height() });
                } else
{
                    g.selectBox.css({ left: g.wrapper.offset().left, top: g.wrapper.offset().top + 1 + g.wrapper.outerHeight() });
                }
            }
            else
{
                var topheight = g.wrapper.offset().top - $(window).scrollTop();
                var selfheight = g.selectBox.height() + textHeight + 4;
                if (topheight + selfheight > $(window).height() && topheight > selfheight)
{
                    g.selectBox.css("marginTop", -1 * (g.selectBox.height() + textHeight + 5));
                }
            }
        },
        _toggleSelectBox: function (isHide)
{
            var g = this, p = this.options;
            if (!g || !p) return;
            //避免同一界面弹出多个菜单的问题
            var managers = $.zoeui.find($.zoeui.controls.ComboBox);
            for (var i = 0, l = managers.length; i < l; i++)
            {
                var o = managers[i];
                if (o.id != g.id)
                {
                    if (o.selectBox.is(":visible") != null && o.selectBox.is(":visible"))
                    {
                        o.selectBox.hide();
                    }
                }
            }
            managers = $.zoeui.find($.zoeui.controls.DateEditor);
            for (var i = 0, l = managers.length; i < l; i++)
            {
                var o = managers[i];
                if (o.id != g.id)
                {
                    if (o.dateeditor.is(":visible") != null && o.dateeditor.is(":visible"))
                    {
                        o.dateeditor.hide();
                    }
                }
            }
            var textHeight = g.wrapper.height();
            g.boxToggling = true;
            if (isHide)
{
                if (p.slide)
{
                    g.selectBox.slideToggle('fast', function ()
{
                        g.boxToggling = false;
                    });
                }
                else
{
                    g.selectBox.hide();
                    g.boxToggling = false;
                }
            }
            else
{
                g.updateSelectBoxPosition();
                if (p.slide)
{
                    g.selectBox.slideToggle('fast', function ()
{
                        g.boxToggling = false;
                        if (!p.isShowCheckBox && $('td.l-selected', g.selectBox).length > 0)
{
                            var offSet = ($('td.l-selected', g.selectBox).offset().top - g.selectBox.offset().top);
                            $(".l-box-select-inner", g.selectBox).animate({ scrollTop: offSet });
                        }
                    });
                }
                else
{
                    g.selectBox.show();
                    g.boxToggling = false;
                    if (!g.tree && !g.grid && !p.isShowCheckBox && $('td.l-selected', g.selectBox).length > 0)
{
                        var offSet = ($('td.l-selected', g.selectBox).offset().top - g.selectBox.offset().top);
                        $(".l-box-select-inner", g.selectBox).animate({ scrollTop: offSet });
                    }
                }
            }
            g.isShowed = g.selectBox.is(":visible");
            g.trigger('toggle', [isHide]);
            g.trigger(isHide ? 'hide' : 'show');
        },
        _highLight: function (str, key)
{
            if (!str) return str;
            var index = str.indexOf(key);
            if (index == -1) return str;
            return str.substring(0, index) + "<span class='l-highLight'>" + key + "</span>" + str.substring(key.length + index);
        },
        _setAutocomplete: function (value)
        {
            var g = this, p = this.options;
            if (!value) return;
            g.inputText.removeAttr("readonly");
            var lastText = g.inputText.val();
            g.inputText.keyup(function ()
            {
                if (this._acto)
                    clearTimeout(this._acto);
                this._acto = setTimeout(function ()
                {
                    if (lastText == g.inputText.val()) return;
                    p.initValue = "";
                    g.valueField.val("");
                    if (p.url)
                    {
                        g.setParm('key', g.inputText.val());
                        g.set('url', p.url);
                        g.selectBox.show();
                    } else if (p.grid)
                    {
                        g.grid.setParm('key', g.inputText.val());
                        g.grid.reload();
                    }else if (p.data){
                        g.showData = [];
                        var key = g.inputText.val().toUpperCase();
                        for(var i in p.data){
                            //转换成大写
                            var severDataName = p.data[i][p.textField].toUpperCase();                                           
                            //定义拼音
                            var severDataSpell;
                            if(p.autoSpellCode){
                                if(p.data[i].spellCode){
                                    severDataSpell = p.data[i].spellCode.toUpperCase();
                                }
                            }
                            //匹配数据
                            if(severDataName.indexOf(key) > -1){
                                g.showData.push(p.data[i]);
                            }else{
                                //匹配拼音
                                if(severDataSpell){
                                    if(severDataSpell.indexOf(key) > -1){
                                        g.showData.push(p.data[i]);
                                    }
                                }
                            }
                        }
                        g._setData(g.showData);
                        g.selectBox.show();                     
                    }
                    lastText = g.inputText.val();
                    this._acto = null;
                }, 300);
            });
        }
    });

    $.zoeui.controls.ComboBox.prototype.setValue = $.zoeui.controls.ComboBox.prototype.selectValue;
    //设置文本框和隐藏控件的值
    $.zoeui.controls.ComboBox.prototype.setInputValue = $.zoeui.controls.ComboBox.prototype._changeValue;
 //Key Init
    (function ()
    {
        $(document).unbind('keydown.zoecombobox');
        $(document).bind('keydown.zoecombobox',function (event)
        {  
            var act = document.activeElement;
            if(!$(act).is(':text')){      
                return;
            }            
            var curInput = $(act);
            if (curInput.length && curInput.attr("data-comboboxid"))
            { 
                var combobox = zoe.get(curInput.attr("data-comboboxid"));
                if (!combobox) return;
                if (!combobox.get("keySupport")) return;
                if (event.keyCode == 38) //up 
                {
                    combobox.upFocus(); 
                } else if (event.keyCode == 40) //down
                {
                    if (combobox.hasBind('textBoxKeyDown'))
                    {
                        combobox.trigger('textBoxKeyDown', [
                            {
                                callback: function ()
                                {
                                    down();
                                }
                            }]);
                    }
                    else
                    {
                        down();
                    }
                    function down()
                    {
                        if (!combobox.selectBox.is(":visible"))
                        {
                            combobox.selectBox.show();
                        }
                        combobox.downFocus();
                    }
                }
                else if (event.keyCode == 13) //enter
                {
                    if (!combobox.selectBox.is(":visible")) return;
                    var curTd = combobox.selectBox.table.find("td.l-over");
                    if (curTd.length)
                    {
                        var value = curTd.attr("value");
                        
                        if (combobox.enabledLoadDetail())
                        {
                            combobox.loadDetail(value, function (data)
                            {
                                var index = combobox.getRowIndex(value);
                                if (index == -1) return;
                                combobox.data = combobox.data || [];
                                combobox.data[index] = combobox.selected = data;
                                toSelect();
                            });
                        } else
                        {
                            toSelect();
                        }
                        function toSelect()
                        {
                            combobox._changeValue(value, curTd.attr("text"), true);
                            combobox.selectBox.hide();
                            combobox.trigger('textBoxKeyEnter', [{
                                element: curTd.get(0)
                            }]);
                        }
                    }else{
                        if(combobox.selectedValue != '' && combobox.selectedValue != undefined && combobox.selectedValue != null){
                         combobox._changeValue(combobox.selectedValue, combobox.selectedText, true);
                            combobox.selectBox.hide();
                        }
                    }
                  
                }
            } 
        });

    })();

})(jQuery);﻿


/**
* jQuery zoeUI 1.0.0
* 
* zoeDateEditor 时间组件 
*/
(function ($)
{
    $.fn.zoeDateEditor = function ()
    {
        return $.zoeui.run.call(this, "zoeDateEditor", arguments);
    };

    $.fn.zoeGetDateEditorManager = function ()
    {
        return $.zoeui.run.call(this, "zoeGetDateEditorManager", arguments);
    };

    $.zoeDefaults.DateEditor = {
        format: "yyyy-MM-dd hh:mm",
        width : null,
        showTime: false,
        onChangeDate: false,
        absolute: true,  //选择框是否在附加到body,并绝对定位
        cancelable: true,      //可取消选择
        readonly: false,        //组件是否只读，不可选日期
        inputReadonly:true,     //input是否只读, 可选日期input不可以编辑
        onSetValue:null,         //设置完值后的回调函数
        timeOnly:false,      //只显示时间
        target:[]         //自定义快速时间
    };
    $.zoeDefaults.DateEditorString = {
        dayMessage: ["日", "一", "二", "三", "四", "五", "六"],
        monthMessage: ["一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"],
        todayMessage: "今天",
        currentMessage:"当前",
        closeMessage: "关闭"
    };
    $.zoeMethos.DateEditor = {};

    $.zoeui.controls.DateEditor = function (element, options)
    {
        $.zoeui.controls.DateEditor.base.constructor.call(this, element, options);
    };
    $.zoeui.controls.DateEditor.zoeExtend($.zoeui.controls.Input, {
        __getType: function ()
        {
            return 'DateEditor';
        },
        __idPrev: function ()
        {
            return 'DateEditor';
        },
        _extendMethods: function ()
        {
            return $.zoeMethos.DateEditor;
        },
        _render: function ()
        {
            var g = this, p = this.options;
            if (!p.showTime && p.format.indexOf(" hh:mm") > -1)
                p.format = p.format.replace(" hh:mm", "");
            if (this.element.tagName.toLowerCase() != "input" || this.element.type != "text")
                return;
            g.inputText = $(this.element);
            if (!g.inputText.hasClass("l-text-field"))
                g.inputText.addClass("l-text-field");
            if(p.timeOnly){
                g.link = $('<div class="l-trigger"><div class="zoe-trigger-icon"></div></div>');
            }else{
                g.link = $('<div class="l-trigger"><div class="l-trigger-icon"></div></div>');
            }
            g.text = g.inputText.wrap('<div class="l-text l-text-date"></div>').parent();
            g.text.append('<div class="l-text-l"></div><div class="l-text-r"></div>');
            g.text.append(g.link);
            //添加个包裹，
            g.textwrapper = g.text.wrap('<div class="l-text-wrapper"></div>').parent();
            var dateeditorHTML = "";
            dateeditorHTML += "<div class='l-box-dateeditor' style='display:none'>";
        if(!p.timeOnly){
            dateeditorHTML += "    <div class='l-box-dateeditor-header'>";
            dateeditorHTML += "        <div class='l-box-dateeditor-header-btn l-box-dateeditor-header-prevyear'><span></span></div>";
            dateeditorHTML += "        <div class='l-box-dateeditor-header-btn l-box-dateeditor-header-prevmonth'><span></span></div>";
            dateeditorHTML += "        <div class='l-box-dateeditor-header-text'><a class='l-box-dateeditor-header-month'></a> , <a  class='l-box-dateeditor-header-year'></a></div>";
            dateeditorHTML += "        <div class='l-box-dateeditor-header-btn l-box-dateeditor-header-nextmonth'><span></span></div>";
            dateeditorHTML += "        <div class='l-box-dateeditor-header-btn l-box-dateeditor-header-nextyear'><span></span></div>";
            dateeditorHTML += "    </div>";
        }
            dateeditorHTML += "    <div class='l-box-dateeditor-body'>";
            if (p.timeOnly) {
                dateeditorHTML += "       <div class='zoe-time'>";
                dateeditorHTML += "            <div class='zoe-time-top'>快速选择</div>";
                dateeditorHTML += "            <ul class='zoe-time-begin'>";  
        
        
            for(var i=0;i<p.target.length;i=i+2){   
                           
                    dateeditorHTML += "                 <li><span>"+p.target[i]+"</span>:<span>"+p.target[i+1]+"</span></li>";     
                      
            }
            dateeditorHTML += "                 </ul> "; 
                dateeditorHTML += "       </div> ";
            } else {
                dateeditorHTML += "        <table cellpadding='0' cellspacing='0' border='0' class='l-box-dateeditor-calendar'>";
                dateeditorHTML += "            <thead>";
                dateeditorHTML += "                <tr><td align='center'></td><td align='center'></td><td align='center'></td><td align='center'></td><td align='center'></td><td align='center'></td><td align='center'></td></tr>";
                dateeditorHTML += "            </thead>";
                dateeditorHTML += "            <tbody>";
                dateeditorHTML += "                <tr class='l-first'><td align='center'></td><td align='center'></td><td align='center'></td><td align='center'></td><td align='center'></td><td align='center'></td><td align='center'></td></tr><tr><td align='center'></td><td align='center'></td><td align='center'></td><td align='center'></td><td align='center'></td><td align='center'></td><td align='center'></td></tr><tr><td align='center'></td><td align='center'></td><td align='center'></td><td align='center'></td><td align='center'></td><td align='center'></td><td align='center'></td></tr><tr><td align='center'></td><td align='center'></td><td align='center'></td><td align='center'></td><td align='center'></td><td align='center'></td><td align='center'></td></tr><tr><td align='center'></td><td align='center'></td><td align='center'></td><td align='center'></td><td align='center'></td><td align='center'></td><td align='center'></td></tr><tr><td align='center'></td><td align='center'></td><td align='center'></td><td align='center'></td><td align='center'></td><td align='center'></td><td align='center'></td></tr>";
                dateeditorHTML += "            </tbody>";
                dateeditorHTML += "        </table>";
            }
            dateeditorHTML += "        <ul class='l-box-dateeditor-monthselector'><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li></ul>";
            dateeditorHTML += "        <div class='l-box-dateeditor-yearselector'><ul><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li></ul><span class='l-box-dateeditor-arr-l'></span><span class='l-box-dateeditor-arr-r'></span><div class='clear'></div></div>";
            dateeditorHTML += "        <ul class='l-box-dateeditor-hourselector'><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li></ul>";
            dateeditorHTML += "        <ul class='l-box-dateeditor-minuteselector'><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li></ul>";
            dateeditorHTML += "    </div>";
            dateeditorHTML += "    <div class='l-box-dateeditor-toolbar'>";
            dateeditorHTML += "        <div class='l-box-dateeditor-time'><div class='hourspinner'><a class='hourspinnerup'></a><a class='hourspinnerdown'></a></div><div class='minutespinner'><a class='minutespinnerup'></a><a class='minutespinnerdown'></a></div></div>";
            dateeditorHTML += "        <div class='l-button l-button-today'></div>";
            dateeditorHTML += "        <div class='l-button l-button-close'></div>";
            dateeditorHTML += "        <div class='l-clear'></div>";
            dateeditorHTML += "    </div>";
            dateeditorHTML += "</div>";
            g.dateeditor = $(dateeditorHTML);
            if (p.absolute)
                g.dateeditor.appendTo('body').addClass("l-box-dateeditor-absolute");
            else
                g.textwrapper.append(g.dateeditor);
            g.header = $(".l-box-dateeditor-header", g.dateeditor);
            g.body = $(".l-box-dateeditor-body", g.dateeditor);
            //快速选择
            g.quickSelect =  $(".zoe-time", g.body);
            if(p.timeOnly){
                $(".l-box-dateeditor-body").css('border-top','none');
            }
            g.toolbar = $(".l-box-dateeditor-toolbar", g.dateeditor);

            g.body.thead = $("thead", g.body);
            g.body.tbody = $("tbody", g.body);
            g.body.monthselector = $(".l-box-dateeditor-monthselector", g.body);
            g.body.yearselector = $(".l-box-dateeditor-yearselector", g.body);
            g.body.hourselector = $(".l-box-dateeditor-hourselector", g.body);
            g.body.minuteselector = $(".l-box-dateeditor-minuteselector", g.body);

            g.body.yearBtnLeft = $(".l-box-dateeditor-arr-l", g.body);
            g.body.yearBtnRight = $(".l-box-dateeditor-arr-r", g.body);

            g.toolbar.time = $(".l-box-dateeditor-time", g.toolbar);
            //时钟调整
            g.toolbar.hourspinner= $(".hourspinner", g.toolbar.time);
            g.toolbar.hourspinnerup= $(".hourspinnerup", g.toolbar.hourspinner);
            g.toolbar.hourspinnerdown= $(".hourspinnerdown", g.toolbar.hourspinner);
            //分钟调整
            g.toolbar.minutespinner= $(".minutespinner", g.toolbar.time);
            g.toolbar.minutespinnerup= $(".minutespinnerup", g.toolbar.minutespinner);
            g.toolbar.minutespinnerdown= $(".minutespinnerdown", g.toolbar.minutespinner);
            g.toolbar.time.hour = $("<a></a>");
            g.toolbar.time.minute = $("<a></a>");
            g.buttons = {
                btnPrevYear: $(".l-box-dateeditor-header-prevyear", g.header),
                btnNextYear: $(".l-box-dateeditor-header-nextyear", g.header),
                btnPrevMonth: $(".l-box-dateeditor-header-prevmonth", g.header),
                btnNextMonth: $(".l-box-dateeditor-header-nextmonth", g.header),
                btnYear: $(".l-box-dateeditor-header-year", g.header),
                btnMonth: $(".l-box-dateeditor-header-month", g.header),
                btnToday: $(".l-button-today", g.toolbar),
                btnClose: $(".l-button-close", g.toolbar)
            };
            var nowDate = new Date();
            g.now = {
                year: nowDate.getFullYear(),
                month: nowDate.getMonth() + 1, //注意这里
                day: nowDate.getDay(),
                date: nowDate.getDate(),
                hour: nowDate.getHours(),
                minute: nowDate.getMinutes()
            };
            //当前的时间
            g.currentDate = {
                year: nowDate.getFullYear(),
                month: nowDate.getMonth() + 1,
                day: nowDate.getDay(),
                date: nowDate.getDate(),
                hour: nowDate.getHours(),
                minute: nowDate.getMinutes()
            };
            //选择的时间
            g.selectedDate = null;
            //使用的时间
            g.usedDate = null;



            //初始化数据
            //设置周日至周六
            $("td", g.body.thead).each(function (i, td)
            {
                $(td).html(p.dayMessage[i]);
            });
            //设置一月到十一二月
            $("li", g.body.monthselector).each(function (i, li)
            {
                $(li).html(p.monthMessage[i]);
            });
            //设置按钮
            if(p.timeOnly){
              g.buttons.btnToday.html(p.currentMessage);
            }else{
            g.buttons.btnToday.html(p.todayMessage);
            }
            g.buttons.btnClose.html(p.closeMessage);
            //设置时间
            if (p.showTime)
            {
                g.toolbar.time.show();
                g.toolbar.hourspinner.show();
                g.toolbar.minutespinner.show();
                g.toolbar.time.append(g.toolbar.time.hour).append(":").append(g.toolbar.time.minute);
                $("li", g.body.hourselector).each(function (i, item)
                {
                    var str = i;
                    if (i < 10) str = "0" + i.toString();
                    $(this).html(str);
                });
                $("li", g.body.minuteselector).each(function (i, item)
                {
                    var str = i;
                    if (i < 10) str = "0" + i.toString();
                    $(this).html(str);
                });
            }
            //设置主体
            g.bulidContent();
            //初始化   
            //初始值
            if (p.initValue)
            {
                g.inputText.val(p.initValue);
            }
            if (g.inputText.val() != "")
            {
                g.onTextChange();
            }
            /**************
            **bulid evens**
            *************/
            g.dateeditor.hover(null, function (e)
            {
                if (g.dateeditor.is(":visible") && !g.editorToggling)
                {
                    g.toggleDateEditor(true);
                }
            });
            //toggle even
            g.link.hover(function ()
            {
                if (p.disabled) return;
                this.className = "l-trigger-hover";
            }, function ()
            {
                if (p.disabled) return;
                this.className = "l-trigger";
            }).mousedown(function ()
            {
                if (p.disabled) return;
                this.className = "l-trigger-pressed";
            }).mouseup(function ()
            {
                if (p.disabled) return;
                this.className = "l-trigger-hover";
            }).click(function ()
            {
                if (p.disabled) return;
                g.bulidContent();
                g.toggleDateEditor(g.dateeditor.is(":visible"));
            });
            g.inputText.click(function () {
                if (p.disabled) return;
                g.bulidContent();
                g.toggleDateEditor(g.dateeditor.is(":visible"));
            });
            //不可用属性时处理
            if (p.disabled)
            {
                g.inputText.attr("readonly", "readonly");
                g.text.addClass('l-text-disabled');
            }
            g.buttons.btnClose.click(function ()
            {
                g.toggleDateEditor(true);
            });
            //日期 点击
            $("td", g.body.tbody).hover(function ()
            {
                if ($(this).hasClass("l-box-dateeditor-today")) return;
                $(this).addClass("l-box-dateeditor-over");
            }, function ()
            {
                $(this).removeClass("l-box-dateeditor-over");
            }).click(function ()
            {
                $(".l-box-dateeditor-selected", g.body.tbody).removeClass("l-box-dateeditor-selected");
                if (!$(this).hasClass("l-box-dateeditor-today"))
                    $(this).addClass("l-box-dateeditor-selected");
                g.currentDate.date = parseInt($(this).html());
                g.currentDate.day = new Date(g.currentDate.year, g.currentDate.month - 1, 1).getDay();
                if ($(this).hasClass("l-box-dateeditor-out"))
                {
                    if ($("tr", g.body.tbody).index($(this).parent()) == 0)
                    {
                        if (--g.currentDate.month == 0)
                        {
                            g.currentDate.month = 12;
                            g.currentDate.year--;
                        }
                    } else
                    {
                        if (++g.currentDate.month == 13)
                        {
                            g.currentDate.month = 1;
                            g.currentDate.year++;
                        }
                    }
                }
                g.selectedDate = {
                    year: g.currentDate.year,
                    month: g.currentDate.month,
                    date: g.currentDate.date
                };
                g.showDate();
                g.editorToggling = true;
                g.dateeditor.slideToggle('fast', function ()
                {
                    g.editorToggling = false;
                });
            });

            $(".l-box-dateeditor-header-btn", g.header).hover(function ()
            {
                $(this).addClass("l-box-dateeditor-header-btn-over");
            }, function ()
            {
                $(this).removeClass("l-box-dateeditor-header-btn-over");
            });
             //年份面板切换
            g.body.yearBtnLeft.click(function ()
            {
                var currentFirstYear=parseInt($("li:first", g.body.yearselector).text(),10);
                $("li", g.body.yearselector).each(function (i, item)
                    {
                        var currentYear = currentFirstYear + (i -10);
                        if (currentYear == g.currentDate.year)
                            $(this).addClass("l-selected");
                        else
                            $(this).removeClass("l-selected");
                        $(this).html(currentYear);
                    }); 
            });
            g.body.yearBtnRight.click(function ()
            {   
                var currentFirstYear=parseInt($("li:first", g.body.yearselector).text(),10);
                $("li", g.body.yearselector).each(function (i, item)
                    {
                        var currentYear = currentFirstYear + (i +10);
                        if (currentYear == g.currentDate.year)
                            $(this).addClass("l-selected");
                        else
                            $(this).removeClass("l-selected");
                        $(this).html(currentYear);
                    });

            });   
            //选择年份
            g.buttons.btnYear.click(function ()
            {
                //build year list
                if (!g.body.yearselector.is(":visible"))
                {
                    $("li", g.body.yearselector).each(function (i, item)
                    {
                        var currentYear = g.currentDate.year + (i - 4);
                        if (currentYear == g.currentDate.year)
                            $(this).addClass("l-selected");
                        else
                            $(this).removeClass("l-selected");
                        $(this).html(currentYear);
                    });
                }
                g.body.monthselector.slideUp();
                if(g.body.yearselector.is(":hidden")){
                    g.body.yearselector.slideDown();
                    g.body.yearBtnLeft.show();
                    g.body.yearBtnRight.show();
               }else{
                    g.body.yearselector.slideUp();
                    g.body.yearBtnLeft.hide();
                    g.body.yearBtnRight.hide();
               }
               
            });
            g.body.yearselector.hover(function () { }, function ()
            {   
                g.body.yearBtnLeft.hide();
                g.body.yearBtnRight.hide();
                $(this).slideUp();
            });
            $("li", g.body.yearselector).click(function ()
            {
                g.currentDate.year = parseInt($(this).html());
                g.body.yearselector.slideUp();
                g.bulidContent();
            });
            //select month
            g.buttons.btnMonth.click(function ()
            {
                $("li", g.body.monthselector).each(function (i, item)
                {
                    //add selected style
                    if (g.currentDate.month == i + 1)
                        $(this).addClass("l-selected");
                    else
                        $(this).removeClass("l-selected");
                });
                g.body.yearselector.slideUp();
                if(g.body.monthselector.is(':hidden')){
                    g.body.monthselector.slideDown();
                }else{
                    g.body.monthselector.slideUp();
                }
                
            });
            g.body.monthselector.hover(function () { }, function ()
            {
                $(this).slideUp("fast");
            });
            $("li", g.body.monthselector).click(function ()
            {
                var index = $("li", g.body.monthselector).index(this);
                g.currentDate.month = index + 1;
                g.body.monthselector.slideUp();
                g.bulidContent();
            });

            //选择小时
            g.toolbar.time.hour.click(function ()
            {
                $("li", g.body.hourselector).each(function (i, item)
                {
                    //add selected style
                    if (g.currentDate.hour == i)
                        $(this).addClass("l-selected");
                    else
                        $(this).removeClass("l-selected");
                });
                //g.body.hourselector.slideToggle();
               g.body.minuteselector.slideUp();
               g.toolbar.time.minute.removeClass('btn-selected'); 
               if(g.body.hourselector.is(":hidden")){
                    g.body.hourselector.slideDown();
                    g.toolbar.time.hour.addClass('btn-selected');
               }else{
                    g.body.hourselector.slideUp();
                    g.toolbar.time.hour.removeClass('btn-selected');
               }
            });
            g.body.hourselector.hover(function () { }, function ()
            {
                $(this).slideUp("fast");
                g.toolbar.time.hour.removeClass('btn-selected');
            });
            $("li", g.body.hourselector).click(function ()
            {
                var index = $("li", g.body.hourselector).index(this);
                g.currentDate.hour = index;
                //g.body.hourselector.slideToggle();
                g.body.hourselector.slideUp("fast");
                g.toolbar.time.hour.removeClass('btn-selected');
                g.bulidContent();
                g.showDate();
            });
            //选择分钟
            g.toolbar.time.minute.click(function ()
            {
                $("li", g.body.minuteselector).each(function (i, item)
                {
                    //add selected style
                    if (g.currentDate.minute == i)
                        $(this).addClass("l-selected");
                    else
                        $(this).removeClass("l-selected");
                });
                g.body.hourselector.slideUp();
                g.toolbar.time.hour.removeClass('btn-selected');
                if(g.body.minuteselector.is(":hidden")){
                    g.body.minuteselector.slideDown();                  
                    g.toolbar.time.minute.addClass('btn-selected');
                    var index = $("li", this).index($('li.l-selected', this));
                    if (index > 29)
                    {
                        var offSet = ($('li.l-selected', this).offset().top - $(this).offset().top);
                        $(this).animate({ scrollTop: offSet });
                    }
               }else{
                    g.body.minuteselector.slideUp(); 
                    g.toolbar.time.minute.removeClass('btn-selected');                  
               }
            });

             //快速选择
            $("ul li",g.quickSelect).click(function ()
            {
                var zoehour= parseInt($(this).find('span').eq(0).html(),10);
                var zoeminute=parseInt($(this).find('span').eq(1).html(),10);
                g.currentDate.hour = zoehour;
                g.currentDate.minute =zoeminute;
                g.dateeditor.slideToggle();
                g.bulidContent();
                g.showDate();
            });


            g.body.minuteselector.hover(function () { }, function ()
            {
                $(this).slideUp("fast");
                g.toolbar.time.minute.removeClass('btn-selected');
            });
            $("li", g.body.minuteselector).click(function ()
            {
                var index = $("li", g.body.minuteselector).index(this);
                g.currentDate.minute = index;
                g.body.minuteselector.slideUp("fast"); 
                g.toolbar.time.minute.removeClass('btn-selected');
                g.bulidContent();
                g.showDate();
            });

            //上个月
            g.buttons.btnPrevMonth.click(function ()
            {
                if (--g.currentDate.month == 0)
                {
                    g.currentDate.month = 12;
                    g.currentDate.year--;
                }
                g.bulidContent();
            });
            //下个月
            g.buttons.btnNextMonth.click(function ()
            {
                if (++g.currentDate.month == 13)
                {
                    g.currentDate.month = 1;
                    g.currentDate.year++;
                }
                g.bulidContent();
            });
            //上一年
            g.buttons.btnPrevYear.click(function ()
            {
                g.currentDate.year--;
                g.bulidContent();
            });
            //下一年
            g.buttons.btnNextYear.click(function ()
            {
                g.currentDate.year++;
                g.bulidContent();
            });
            //今天
            g.buttons.btnToday.click(function ()
            {
                g.currentDate = {
                    year: g.now.year,
                    month: g.now.month,
                    day: g.now.day,
                    date: g.now.date
                };
                g.selectedDate = {
                    year: g.now.year,
                    month: g.now.month,
                    day: g.now.day,
                    date: g.now.date
                };
                g.showDate();
                g.dateeditor.slideToggle("fast");
            });
             // 时钟调整
            g.toolbar.hourspinnerup.click(function() {
                var  currentDateHour = parseInt(g.toolbar.time.hour.html(), 10);
                var  newDateHour=currentDateHour+1;
                if(newDateHour>23){
                    newDateHour=23;
                }
                g.currentDate.hour = newDateHour;
                $("li", g.body.hourselector).each(function (i, item)
                {
                    //add selected style
                    if (g.currentDate.hour == i)
                        $(this).addClass("l-selected");
                    else
                        $(this).removeClass("l-selected");
                });
                g.bulidContent();
                g.showDate();
            });
            g.toolbar.hourspinnerdown.click(function() {
                var  currentDateHour = parseInt(g.toolbar.time.hour.html(), 10);
                var  newDateHour=currentDateHour-1;
                if(newDateHour<0){
                    newDateHour=0;
                }
                g.currentDate.hour = newDateHour;
                $("li", g.body.hourselector).each(function (i, item)
                {
                    //add selected style
                    if (g.currentDate.hour == i)
                        $(this).addClass("l-selected");
                    else
                        $(this).removeClass("l-selected");
                });
                g.bulidContent();
                g.showDate();
            });
            //分钟调整
            g.toolbar.minutespinnerup.click(function() {
                var  currentDateMinute = parseInt(g.toolbar.time.minute.html(), 10);
                var  newDateMinute=currentDateMinute+1;
                if(newDateMinute>59){
                    newDateMinute=59;
                }
                g.currentDate.minute = newDateMinute;
                $("li", g.body.minuteselector).each(function (i, item)
                {
                    //add selected style
                    if (g.currentDate.minute == i)
                        $(this).addClass("l-selected");
                    else
                        $(this).removeClass("l-selected");
                });
                g.bulidContent();
                g.showDate();
            });
            g.toolbar.minutespinnerdown.click(function() {
                var  currentDateMinute = parseInt(g.toolbar.time.minute.html(), 10);
                var  newDateMinute=currentDateMinute-1;
                if(newDateMinute<0){
                    newDateMinute=0;
                }
                g.currentDate.minute = newDateMinute;
                $("li", g.body.minuteselector).each(function (i, item)
                {
                    //add selected style
                    if (g.currentDate.minute == i)
                        $(this).addClass("l-selected");
                    else
                        $(this).removeClass("l-selected");
                });
                g.bulidContent();
                g.showDate();
            });
            //文本框
            g.inputText.change(function ()
            {
                g.onTextChange();
            }).blur(function ()
            {
                g.text.removeClass("l-text-focus");
            }).focus(function ()
            {
                g.text.addClass("l-text-focus");
            });
            g.text.hover(function ()
            {
                g.text.addClass("l-text-over");
            }, function ()
            {
                g.text.removeClass("l-text-over");
            });
            //LEABEL 支持
            if (p.label)
            {
                g.labelwrapper = g.textwrapper.wrap('<div class="l-labeltext"></div>').parent();
                g.labelwrapper.prepend('<div class="l-text-label" style="float:left;display:inline;">' + p.label + ':&nbsp</div>');
                g.textwrapper.css('float', 'left');
                if (!p.labelWidth)
                {
                    p.labelWidth = $('.l-text-label', g.labelwrapper).outerWidth();
                } else
                {
                    $('.l-text-label', g.labelwrapper).outerWidth(p.labelWidth);
                }
                $('.l-text-label', g.labelwrapper).width(p.labelWidth);
                $('.l-text-label', g.labelwrapper).height(g.text.height());
                g.labelwrapper.append('<br style="clear:both;" />');
                if (p.labelAlign)
                {
                    $('.l-text-label', g.labelwrapper).css('text-align', p.labelAlign);
                }
                g.textwrapper.css({ display: 'inline' });
                g.labelwrapper.width(g.text.outerWidth() + p.labelWidth + 2);
            }

            g.set(p);
            //增加鼠标在日期控件外点击隐藏日期选择框功能
            $(document).bind("click.dateeditor", function (e)
            {
                if (g.dateeditor.is(":visible") && $((e.target || e.srcElement)).closest( ".l-box-dateeditor, .l-text-date" ).length == 0)
                {
                    g.toggleDateEditor(true);
                }
            });
             //设置input是否可以编辑
            if(p.inputReadonly){
                g.inputText.attr("readonly","readonly");
            }
        },
        destroy: function ()
        {
            if (this.textwrapper) this.textwrapper.remove();
            if (this.dateeditor) this.dateeditor.remove();
            this.options = null;
            $.zoeui.remove(this);
        },
        bulidContent: function ()
        {
            var g = this, p = this.options;
            //当前月第一天星期
            var thismonthFirstDay = new Date(g.currentDate.year, g.currentDate.month - 1, 1).getDay();
            //当前月天数
            var nextMonth = g.currentDate.month;
            var nextYear = g.currentDate.year;
            if (++nextMonth == 13)
            {
                nextMonth = 1;
                nextYear++;
            }
            var monthDayNum = new Date(nextYear, nextMonth - 1, 0).getDate();
            //当前上个月天数
            var prevMonthDayNum = new Date(g.currentDate.year, g.currentDate.month - 1, 0).getDate();

            g.buttons.btnMonth.html(p.monthMessage[g.currentDate.month - 1]);
            g.buttons.btnYear.html(g.currentDate.year);
            g.toolbar.time.hour.html(g.currentDate.hour);
            g.toolbar.time.minute.html(g.currentDate.minute);
            if (g.toolbar.time.hour.html().length == 1)
                g.toolbar.time.hour.html("0" + g.toolbar.time.hour.html());
            if (g.toolbar.time.minute.html().length == 1)
                g.toolbar.time.minute.html("0" + g.toolbar.time.minute.html());
            $("td", this.body.tbody).each(function () { this.className = "" });
            $("tr", this.body.tbody).each(function (i, tr)
            {
                $("td", tr).each(function (j, td)
                {
                    var id = i * 7 + (j - thismonthFirstDay);
                    var showDay = id + 1;
                    if (g.selectedDate && g.currentDate.year == g.selectedDate.year &&
                            g.currentDate.month == g.selectedDate.month &&
                            id + 1 == g.selectedDate.date)
                    {
                        if (j == 0 || j == 6)
                        {
                            $(td).addClass("l-box-dateeditor-holiday")
                        }
                        $(td).addClass("l-box-dateeditor-selected");
                        $(td).siblings().removeClass("l-box-dateeditor-selected");
                    }
                    else if (g.currentDate.year == g.now.year &&
                            g.currentDate.month == g.now.month &&
                            id + 1 == g.now.date)
                    {
                        if (j == 0 || j == 6)
                        {
                            $(td).addClass("l-box-dateeditor-holiday")
                        }
                        $(td).addClass("l-box-dateeditor-today");
                    }
                    else if (id < 0)
                    {
                        showDay = prevMonthDayNum + showDay;
                        $(td).addClass("l-box-dateeditor-out")
                                .removeClass("l-box-dateeditor-selected");
                    }
                    else if (id > monthDayNum - 1)
                    {
                        showDay = showDay - monthDayNum;
                        $(td).addClass("l-box-dateeditor-out")
                                .removeClass("l-box-dateeditor-selected");
                    }
                    else if (j == 0 || j == 6)
                    {
                        $(td).addClass("l-box-dateeditor-holiday")
                                .removeClass("l-box-dateeditor-selected");
                    }
                    else
                    {
                        td.className = "";
                    }

                    $(td).html(showDay);
                });
            });
            
        },
        updateSelectBoxPosition: function ()
        {
            var g = this, p = this.options;
            if (p.absolute)
            {
                var contentHeight = $(document).height();
                if (Number(g.text.offset().top + 1 + g.text.outerHeight() + g.dateeditor.height()) > contentHeight
                        && contentHeight > Number(g.dateeditor.height() + 1))
                {
                    //若下拉框大小超过当前document下边框,且当前document上留白大于下拉内容高度,下拉内容向上展现
                    g.dateeditor.css({ left: g.text.offset().left, top: g.text.offset().top - 1 - g.dateeditor.height() });
                } else
                {
                    g.dateeditor.css({ left: g.text.offset().left, top: g.text.offset().top + 1 + g.text.outerHeight() });
                }
            }
            else
            {
                if (g.text.offset().top + 4 > g.dateeditor.height() && g.text.offset().top + g.dateeditor.height() + textHeight + 4 - $(window).scrollTop() > $(window).height())
                {
                    g.dateeditor.css("marginTop", -1 * (g.dateeditor.height() + textHeight + 5));
                    g.showOnTop = true;
                }
                else
                {
                    g.showOnTop = false;
                }
            }
        },
        toggleDateEditor: function (isHide)
        {
            var g = this, p = this.options;
            //避免同一界面弹出过个菜单的问题
            var managers = $.zoeui.find($.zoeui.controls.ComboBox);
            for ( var i = 0, l = managers.length; i < l; i++) {
                var o = managers[i];
                if(o.id!=g.id){
                    if(o.selectBox.is(":visible")!=null&&o.selectBox.is(":visible")){
                        o.selectBox.hide();
                    }
                }
            }
            managers = $.zoeui.find($.zoeui.controls.DateEditor);
            for ( var i = 0, l = managers.length; i < l; i++) {
                var o = managers[i];
                if(o.id!=g.id){
                    if(o.dateeditor.is(":visible")!=null&&o.dateeditor.is(":visible")){
                        o.dateeditor.hide();
                    }
                }
            }
            var textHeight = g.text.height();
            g.editorToggling = true;
            if (isHide)
            {
                g.dateeditor.hide('fast', function ()
                {
                    g.editorToggling = false;
                });
            }
            else
            {
                g.updateSelectBoxPosition();
                g.dateeditor.slideDown('fast', function ()
                {
                    g.editorToggling = false;
                });
            }
        },
        showDate: function ()
        {
            var g = this, p = this.options;
            if (!this.currentDate) return;
            this.currentDate.hour = parseInt(g.toolbar.time.hour.html(), 10);
            this.currentDate.minute = parseInt(g.toolbar.time.minute.html(), 10);
            var currentSecond=new Date();
            var ss=currentSecond.getSeconds();
            var dateStr = this.currentDate.year + '/' + this.currentDate.month + '/' + this.currentDate.date + ' ' + this.currentDate.hour + ':' + this.currentDate.minute+ ':' + ss;
            var myDate = new Date(dateStr);
            dateStr = g.getFormatDate(myDate);
            this.inputText.val(dateStr);
            this.onTextChange();
            if($.isFunction(p.onSetValue)){
                p.onSetValue(dateStr);
            }
        },
        isDateTime: function (dateStr)
        {
            var g = this, p = this.options;
            var r = dateStr.match(/^(\d{1,4})(-|\/)(\d{1,2})\2(\d{1,2})$/);
            if (r == null) return false;
            var d = new Date(r[1], r[3] - 1, r[4]);
            if (d == "NaN") return false;
            return (d.getFullYear() == r[1] && (d.getMonth() + 1) == r[3] && d.getDate() == r[4]);
        },
        isLongDateTime: function (dateStr)
        {
            var g = this, p = this.options;
            var reg = /^(\d{1,4})(-|\/)(\d{1,2})\2(\d{1,2}) (\d{1,2}):(\d{1,2})$/;
            var r = dateStr.match(reg);
            if (r == null) return false;
            var d = new Date(r[1], r[3] - 1, r[4], r[5], r[6]);
            if (d == "NaN") return false;
            return (d.getFullYear() == r[1] && (d.getMonth() + 1) == r[3] && d.getDate() == r[4] && d.getHours() == r[5] && d.getMinutes() == r[6]);
        },
        getFormatDate: function (date)
        {
            var g = this, p = this.options;
            if (date == "NaN") return null;
            var format = p.format;
            var o = {
                "M+": date.getMonth() + 1,
                "d+": date.getDate(),
                "h+": date.getHours(),
                "m+": date.getMinutes(),
                "s+": date.getSeconds(),
                "q+": Math.floor((date.getMonth() + 3) / 3),
                "S": date.getMilliseconds()
            }
            if (/(y+)/.test(format))
            {
                format = format.replace(RegExp.$1, (date.getFullYear() + "")
                .substr(4 - RegExp.$1.length));
            }
            for (var k in o)
            {
                if (new RegExp("(" + k + ")").test(format))
                {
                    format = format.replace(RegExp.$1, RegExp.$1.length == 1 ? o[k]
                    : ("00" + o[k]).substr(("" + o[k]).length));
                }
            }
            return format;
        },
        clear: function ()
        {
            this.set('value', '');
            this.usedDate = null;
        },
        //取消选择 
        _setCancelable: function (value)
        {
            var g = this, p = this.options;
            if (!value && g.unselect)
            {
                g.unselect.remove();
                g.unselect = null;
            }
            if (!value && !g.unselect) return;
            g.unselect = $('<div class="l-trigger l-trigger-cancel"><div class="l-trigger-icon"></div></div>').hide();
            g.text.hover(function ()
            {
                g.unselect.show();
            }, function ()
            {
                g.unselect.hide();
            })
            if (!p.disabled && p.cancelable)
            {
                g.text.append(g.unselect);
            }
            g.unselect.hover(function ()
            {
                this.className = "l-trigger-hover l-trigger-cancel";
            }, function ()
            {
                this.className = "l-trigger l-trigger-cancel";
            }).click(function ()
            {
                if (p.readonly) return;
                g.clear();
            });
        },
        //恢复
        _rever: function ()
        {
            var g = this, p = this.options;
            if (!g.usedDate)
            {
                g.inputText.val("");
            } else
            {
                g.inputText.val(g.getFormatDate(g.usedDate));
            }
        },
        _getMatch: function (format)
        {
            var r = [-1, -1, -1, -1, -1, -1], groupIndex = 0, regStr = "^", str = format || this.options.format;
            while (true)
            {
                var tmp_r = str.match(/^yyyy|MM|dd|mm|hh|HH|ss|-|\/|:|\s/);
                if (tmp_r)
                {
                    var c = tmp_r[0].charAt(0);
                    var mathLength = tmp_r[0].length;
                    var index = 'yMdhms'.indexOf(c);
                    if (index != -1)
                    {
                        r[index] = groupIndex + 1;
                        regStr += "(\\d{1," + mathLength + "})";
                    } else
                    {
                        var st = c == ' ' ? '\\s' : c;
                        regStr += "(" + st + ")";
                    }
                    groupIndex++;
                    if (mathLength == str.length)
                    {
                        regStr += "$";
                        break;
                    }
                    str = str.substring(mathLength);
                } else
                {
                    return null;
                }
            }
            return { reg: new RegExp(regStr), position: r };
        },
        _bulidDate: function (dateStr)
        {
            var g = this, p = this.options;
            var r = this._getMatch();
            if (!r) return null;
            var t = dateStr.match(r.reg);
            if (!t) return null;
            var tt = {
                y: r.position[0] == -1 ? 1900 : t[r.position[0]],
                M: r.position[1] == -1 ? 0 : parseInt(t[r.position[1]], 10) - 1,
                d: r.position[2] == -1 ? 1 : parseInt(t[r.position[2]], 10),
                h: r.position[3] == -1 ? 0 : parseInt(t[r.position[3]], 10),
                m: r.position[4] == -1 ? 0 : parseInt(t[r.position[4]], 10),
                s: r.position[5] == -1 ? 0 : parseInt(t[r.position[5]], 10)
            };
            if (tt.M < 0 || tt.M > 11 || tt.d < 0 || tt.d > 31) return null;
            var d = new Date(tt.y, tt.M, tt.d);
            if (p.showTime)
            {
                if (tt.m < 0 || tt.m > 59 || tt.h < 0 || tt.h > 23 || tt.s < 0 || tt.s > 59) return null;
                d.setHours(tt.h);
                d.setMinutes(tt.m);
                d.setSeconds(tt.s);
            }
            return d;
        },
        updateStyle: function ()
        {
            this.onTextChange();
        },
        onTextChange: function ()
        {
            var g = this, p = this.options;
            var val = g.inputText.val();
            if (!val)
            {
                g.selectedDate = null;
                return true;
            }
            var newDate = g._bulidDate(val);
            if (!newDate)
            {
                g._rever();
                return;
            }
            else
            {
                g.usedDate = newDate;
            }
            g.selectedDate = {
                year: g.usedDate.getFullYear(),
                month: g.usedDate.getMonth() + 1, //注意这里
                day: g.usedDate.getDay(),
                date: g.usedDate.getDate(),
                hour: g.usedDate.getHours(),
                minute: g.usedDate.getMinutes()
            };
            g.currentDate = {
                year: g.usedDate.getFullYear(),
                month: g.usedDate.getMonth() + 1, //注意这里
                day: g.usedDate.getDay(),
                date: g.usedDate.getDate(),
                hour: g.usedDate.getHours(),
                minute: g.usedDate.getMinutes()
            };
            var formatVal = g.getFormatDate(newDate);
            g.inputText.val(formatVal);
            g.trigger('changeDate', [formatVal]);
            if ($(g.dateeditor).is(":visible"))
                g.bulidContent();
        },
        _setHeight: function (value)
        {
            var g = this;
            if (value > 4)
            {
                g.text.css({ height: value });
                g.inputText.css({ height: value });
                g.textwrapper.css({ height: value });
            }
        },
        _setWidth: function (value)
        {
            var g = this;
            if (value > 20)
            {
                g.text.css({ width: value });
                g.inputText.css({ width: value - 20 });
                g.textwrapper.css({ width: value });
            }
        },
        _setValue: function (value)
        {
            var g = this;
            if (!value) g.inputText.val('');
            if (typeof value == "string")
            {
                if (/^\/Date/.test(value))
                {
                    value = value.replace(/^\//, "new ").replace(/\/$/, "");
                    eval("value = " + value);
                }
                // else
                // {
                //     g.inputText.val(value);
                // }
                g.inputText.val(value);
                g.usedDate=value;
            }
            if (typeof value == "object")
            {
                if (value instanceof Date)
                {
                    g.inputText.val(g.getFormatDate(value));
                    g.onTextChange();
                }
            }
        },
        _getValue: function ()
        {
            return this.usedDate;
        },
        setEnabled: function ()
        {
            var g = this, p = this.options;
            this.inputText.removeAttr("readonly");
            this.text.removeClass('l-text-disabled');
            p.disabled = false;
        },
        setDisabled: function ()
        {
            var g = this, p = this.options;
            this.inputText.attr("readonly", "readonly");
            this.text.addClass('l-text-disabled');
            p.disabled = true;
        }
    });


})(jQuery);
/**
* jQuery zoeUI 1.0.0
* 
* zoeDialog 弹窗
*/

(function ($)
{
    var l = $.zoeui;

    //全局事件
    $(".l-dialog-btn").live('mouseover', function ()
    {
        $(this).addClass("l-dialog-btn-over");
    }).live('mouseout', function ()
    {
        $(this).removeClass("l-dialog-btn-over");
    });
    $(".l-dialog-tc .l-dialog-close").live('mouseover', function ()
    {
        $(this).addClass("l-dialog-close-over");
    }).live('mouseout', function ()
    {
        $(this).removeClass("l-dialog-close-over");
    });


    $.zoeDialog = function ()
    {
        return l.run.call(null, "zoeDialog", arguments, { isStatic: true });
    };

    //dialog 图片文件夹的路径 预加载
    $.zoeui.DialogImagePath = "../skins/default/images/win/";

    function prevImage(paths)
    {
        for (var i in paths)
        {
            $('<img />').attr('src', l.DialogImagePath + paths[i]);
        }
    }

    $.zoeDefaults.Dialog = {
        cls: null,       //给dialog附加css class
        contentCls: null,
        id: null,        //给dialog附加id
        form:null,
        buttons: null, //按钮集合 
        isDrag: true,   //是否拖动
        width: 280,     //宽度
        height: null,   //高度，默认自适应 
        content: '',    //内容
        target: null,   //目标对象，指定它将以appendTo()的方式载入
        url: null,      //目标页url，默认以iframe的方式载入
        load: false,     //是否以load()的方式加载目标页的内容 
        type: 'none',   //类型 warn、success、error、question
        left: null,     //位置left
        top: null,      //位置top
        modal: true,    //是否模态对话框
        data: null,     //传递数据容器
        name: null,     //创建iframe时 作为iframe的name和id 
        isResize: false, // 是否调整大小
        allowClose: true, //允许关闭
        opener: null,
        timeParmName: null,  //是否给URL后面加上值为new Date().getTime()的参数，如果需要指定一个参数名即可
        closeWhenEnter: null, //回车时是否关闭dialog
        isHidden: true,        //关闭对话框时是否只是隐藏，还是销毁对话框
        show: true,          //初始化时是否马上显示
        title: '消息提示',        //头部 
        showMax: false,                             //是否显示最大化按钮 
        showToggle: false,                          //是否显示收缩窗口按钮
        showMin: false,                             //是否显示最小化按钮
        slide: $.browser.msie ? false : true,        //是否以动画的形式显示 
        fixedType: null,            //在固定的位置显示, 可以设置的值有n, e, s, w, ne, se, sw, nw
        showType: null,             //显示类型,可以设置为slide(固定显示时有效) 
        onLoaded: null,
        onExtend: null,
        onExtended: null,
        onCollapse: null,
        onCollapseed: null,
        onContentHeightChange: null,
        onClose: null,
        onClosed: null,
        onHidden:null,            //隐藏拳关闭回调
        isCloseBtn:false,         //是否需要关闭按钮
        onStopResize: null
    };
    $.zoeDefaults.DialogString = {
        titleMessage: '提示',                     //提示文本标题
        ok: '确定',
        yes: '确定',
        no: '取消',
        cancel: '取消',
        waittingMessage: '正在等待中,请稍候...'
    };

    $.zoeMethos.Dialog = $.zoeMethos.Dialog || {};


    l.controls.Dialog = function (options)
    {
        l.controls.Dialog.base.constructor.call(this, null, options);
    };
    l.controls.Dialog.zoeExtend(l.core.Win, {
        __getType: function ()
        {
            return 'Dialog';
        },
        __idPrev: function ()
        {
            return 'Dialog';
        },
        _extendMethods: function ()
        {
            return $.zoeMethos.Dialog;
        },
        _render: function ()
        {
            var g = this, p = this.options;
            var tmpId = "";
            g.set(p, true);
            
            if(p.type=="waitting"){
                var dialog = $('<div class="l-dialog"><div class="l-dialog-content"></div></div>');
            }else{
                var dialog = $('<div class="l-dialog"><table class="l-dialog-table" cellpadding="0" cellspacing="0" border="0"><tbody><tr><td class="l-dialog-tl"></td><td class="l-dialog-tc"><div class="l-dialog-tc-inner"><div class="l-dialog-icon"></div><div class="l-dialog-title"></div><div class="l-dialog-winbtns"><div class="l-dialog-winbtn l-dialog-close"></div></div></div></td><td class="l-dialog-tr"></td></tr><tr><td class="l-dialog-cl"></td><td class="l-dialog-cc"><div class="l-dialog-body"><div class="l-dialog-image"></div> <div class="l-dialog-content"></div><div class="l-dialog-buttons"><div class="l-dialog-buttons-inner"><span class="alert-text"></span></div></td><td class="l-dialog-cr"></td></tr><tr><td class="l-dialog-bl"></td><td class="l-dialog-bc"></td><td class="l-dialog-br"></td></tr></tbody></table></div>');
            }

            $('body').append(dialog);
            g.dialog = dialog;
            g.element = dialog[0];
            g.dialog.body = $(".l-dialog-body:first", g.dialog);
            g.dialog.header = $(".l-dialog-tc-inner:first", g.dialog);
            g.dialog.winbtns = $(".l-dialog-winbtns:first", g.dialog.header);
            g.dialog.buttons = $(".l-dialog-buttons:first", g.dialog);
            g.dialog.content = $(".l-dialog-content:first", g.dialog);
            g.set(p, false);

            if (p.allowClose == false) $(".l-dialog-close", g.dialog).remove();
            if (p.target || p.url || p.type == "none")
            {
                p.type = null;
                g.dialog.addClass("l-dialog-win");

            }
            if (p.cls) g.dialog.addClass(p.cls);
            if (p.id) g.dialog.attr("id", p.id);

            //设置锁定屏幕、拖动支持 和设置图片
            g.mask();
            if (p.isDrag)
                g._applyDrag();
            if (p.isResize)
                g._applyResize();
           
            if (p.type)
                g._setImage();
            else
            {
                $(".l-dialog-image", g.dialog).remove();
                g.dialog.content.addClass("l-dialog-content-noimage");
            }
            if (p.contentCls)
                g.dialog.content.addClass(p.contentCls);
            if (!p.show)
            {
                g.unmask();
                g.dialog.hide();
            }
            //设置主体内容
            if (p.target)
            {
                g.dialog.content.prepend(p.target);
                $(p.target).show();
            }
            else if (p.url)
            {
                if (p.timeParmName)
                {
                    p.url += p.url.indexOf('?') == -1 ? "?" : "&";
                    p.url += p.timeParmName + "=" + new Date().getTime();
                }
                if (p.load)
                {
                    g.dialog.body.load(p.url, function ()
                    {
                        g._saveStatus();
                        g.trigger('loaded');
                    });
                }
                else
                {
                    g.jiframe = $("<iframe frameborder='0'></iframe>");
                    var framename = p.name ? p.name : "zoewindow" + new Date().getTime();
                    g.jiframe.attr("name", framename);
                    g.jiframe.attr("id", framename);
                    g.dialog.content.prepend(g.jiframe);
                    g.dialog.content.addClass("l-dialog-content-nopadding l-dialog-content-frame");

                    setTimeout(function ()
                    {
                        if (g.dialog.body.find(".l-dialog-loading:first").length == 0)
                            g.dialog.body.append("<div class='l-dialog-loading' style='display:block;'></div>");
                        var iframeloading = $(".l-dialog-loading:first", g.dialog.body);
                        g.jiframe[0].dialog = g;//增加窗口对dialog对象的引用
                        /*
                        可以在子窗口这样使用：
                        var dialog = frameElement.dialog;
                        var dialogData = dialog.get('data');//获取data参数
                        dialog.set('title','新标题'); //设置标题
                        dialog.close();//关闭dialog 
                        */
                        g.jiframe.attr("src", p.url).bind('load.dialog', function ()
                        {
                            iframeloading.hide();
                            g.trigger('loaded');
                        });
                        g.frame = window.frames[g.jiframe.attr("name")];
                    }, 0);
                    // 为了解决ie下对含有iframe的div窗口销毁不正确，进而导致第二次打开时焦点不在当前图层的问题
                    // 加入以下代码 
                    tmpId = 'jquery_zoeui_' + new Date().getTime();
                    g.tmpInput = $("<input></input>");
                    g.tmpInput.attr("id", tmpId);
                    g.dialog.content.prepend(g.tmpInput);
                }
            }
            if (p.opener) g.dialog.opener = p.opener;
            //设置按钮
            if (p.buttons)
            {
                $(p.buttons).each(function (i, item)
                {
                    var btn = $('<div class="l-dialog-btn"><div class="l-dialog-btn-l"></div><div class="l-dialog-btn-r"></div><div class="l-dialog-btn-inner"></div></div>');
                    $(".l-dialog-btn-inner", btn).html(item.text);
                    if(item.text=="取消"){
                        $(".l-dialog-btn-inner", btn).addClass('l-dialog-tip-cancel');
                    }
                    $(".l-dialog-buttons-inner", g.dialog.buttons).prepend(btn);
                    item.width && btn.width(item.width);
                    item.onclick && btn.click(function () { item.onclick(item, g, i) });
                    item.cls && btn.addClass(item.cls);
                });
            } else
            {
                g.dialog.buttons.remove();
            }
            $(".l-dialog-buttons-inner", g.dialog.buttons).append("<div class='l-clear'></div>");


            $(".l-dialog-title", g.dialog)
            .bind("selectstart", function () { return false; });
            g.dialog.click(function ()
            {
                l.win.setFront(g);
            });
            //设置事件
            $(".l-dialog-tc .l-dialog-close", g.dialog).click(function ()
            {
                if (p.isHidden)
                    g.hide();
                else
                    g.close();
            });
            //按钮设置
            if(p.isCloseBtn){
                $(".l-dialog-tc .l-dialog-close", g.dialog).hide();
            }
            if (!p.fixedType)
            {
                if (p.width == 'auto')
                {
                    setTimeout(function ()
                    {
                        resetPos()
                    }, 100);
                } else
                {
                    resetPos();
                }
            }
            function resetPos()
            {
                //位置初始化
                var left = 0;
                var top = 0;
                var width = p.width || g.dialog.width();
                if(p.type=="waitting"){
                    var width =48;
                }
                if (p.slide == true) p.slide = 'fast';
                if (p.left != null) left = p.left;
                else p.left = left = 0.5 * ($(window).width() - width);
                if (p.top != null) top = p.top;
                else p.top = top = 0.5 * ($(window).height() - g.dialog.height()) + $(window).scrollTop() - 10;
                if (left < 0) p.left = left = 0;
                if (top < 0) p.top = top = 0;
                g.dialog.css({ left: left, top: top });
            }
            g.show();
            $('body').bind('keydown.dialog', function (e)
            {
                var key = e.which;
                if (key == 13)
                {
                    g.enter();
                }
                else if (key == 27)
                {
                    g.esc();
                }
            });

            g._updateBtnsWidth();
            g._saveStatus();
            g._onReisze();
            if (tmpId != "")
            {
                $("#" + tmpId).focus();
                $("#" + tmpId).remove();
            }
        },
        _borderX: 12,
        _borderY: 32,
        doMax: function (slide)
        {
            var g = this, p = this.options;
            var width = $(window).width(), height = $(window).height(), left = 0, top = 0;
            if (l.win.taskbar)
            {
                height -= l.win.taskbar.outerHeight();
                if (l.win.top) top += l.win.taskbar.outerHeight();
            }
            if (slide)
            {
                g.dialog.body.animate({ width: width - g._borderX }, p.slide);
                g.dialog.animate({ left: left, top: top }, p.slide);
                g.dialog.content.animate({ height: height - g._borderY - g.dialog.buttons.outerHeight() }, p.slide, function ()
                {
                    g._onReisze();
                });
            }
            else
            {
                g.set({ width: width, height: height, left: left, top: top });
                g._onReisze();
            }
        },
        //最大化
        max: function ()
        {
            var g = this, p = this.options;
            if (g.winmax)
            {
                g.winmax.addClass("l-dialog-recover");
                g.doMax(p.slide);
                if (g.wintoggle)
                {
                    if (g.wintoggle.hasClass("l-dialog-extend"))
                        g.wintoggle.addClass("l-dialog-toggle-disabled l-dialog-extend-disabled");
                    else
                        g.wintoggle.addClass("l-dialog-toggle-disabled l-dialog-collapse-disabled");
                }
                if (g.resizable) g.resizable.set({ disabled: true });
                if (g.draggable) g.draggable.set({ disabled: true });
                g.maximum = true;

                $(window).bind('resize.dialogmax', function ()
                {
                    g.doMax(false);
                });
            }
        },

        //恢复
        recover: function ()
        {
            var g = this, p = this.options;
            if (g.winmax)
            {
                g.winmax.removeClass("l-dialog-recover");
                if (p.slide)
                {
                    g.dialog.body.animate({ width: g._width - g._borderX }, p.slide);
                    g.dialog.animate({ left: g._left, top: g._top }, p.slide);
                    g.dialog.content.animate({ height: g._height - g._borderY - g.dialog.buttons.outerHeight() }, p.slide, function ()
                    {
                        g._onReisze();
                    });
                }
                else
                {
                    g.set({ width: g._width, height: g._height, left: g._left, top: g._top });
                    g._onReisze();
                }
                if (g.wintoggle)
                {
                    g.wintoggle.removeClass("l-dialog-toggle-disabled l-dialog-extend-disabled l-dialog-collapse-disabled");
                }

                $(window).unbind('resize.dialogmax');
            }
            if (this.resizable) this.resizable.set({ disabled: false });
            if (g.draggable) g.draggable.set({ disabled: false });
            g.maximum = false;
        },

        //最小化
        min: function ()
        {
            var g = this, p = this.options;
            var task = l.win.getTask(this);
            if (p.slide)
            {
                g.dialog.body.animate({ width: 1 }, p.slide);
                task.y = task.offset().top + task.height();
                task.x = task.offset().left + task.width() / 2;
                g.dialog.animate({ left: task.x, top: task.y }, p.slide, function ()
                {
                    g.dialog.hide();
                });
            }
            else
            {
                g.dialog.hide();
            }
            g.unmask();
            g.minimize = true;
            g.actived = false;
        },

        active: function ()
        {
            var g = this, p = this.options;
            if (g.minimize)
            {
                var width = g._width, height = g._height, left = g._left, top = g._top;
                if (g.maximum)
                {
                    width = $(window).width();
                    height = $(window).height();
                    left = top = 0;
                    if (l.win.taskbar)
                    {
                        height -= l.win.taskbar.outerHeight();
                        if (l.win.top) top += l.win.taskbar.outerHeight();
                    }
                }
                if (p.slide)
                {
                    g.dialog.body.animate({ width: width - g._borderX }, p.slide);
                    g.dialog.animate({ left: left, top: top }, p.slide);
                }
                else
                {
                    g.set({ width: width, height: height, left: left, top: top });
                }
            }
            g.actived = true;
            g.minimize = false;
            l.win.setFront(g);
            g.show();
        },

        //展开 收缩
        toggle: function ()
        {

            var g = this, p = this.options;
            if (!g.wintoggle) return;
            if (g.wintoggle.hasClass("l-dialog-extend"))
                g.extend();
            else
                g.collapse();
        },

        //收缩
        collapse: function ()
        {
            var g = this, p = this.options;
            if (!g.wintoggle) return;
            if (p.slide)
                g.dialog.content.animate({ height: 1 }, p.slide);
            else
                g.dialog.content.height(1);
            if (this.resizable) this.resizable.set({ disabled: true });
        },

        //展开
        extend: function ()
        {
            var g = this, p = this.options;
            if (!g.wintoggle) return;
            var contentHeight = g._height - g._borderY - g.dialog.buttons.outerHeight();
            if (p.slide)
                g.dialog.content.animate({ height: contentHeight }, p.slide);
            else
                g.dialog.content.height(contentHeight);
            if (this.resizable) this.resizable.set({ disabled: false });
        },
        _updateBtnsWidth: function ()
        {
            var g = this;
            var btnscount = $(">div", g.dialog.winbtns).length;
            g.dialog.winbtns.width(22 * btnscount);
        },
        _setLeft: function (value)
        {
            if (!this.dialog) return;
            if (value != null)
                this.dialog.css({ left: value });
        },
        _setTop: function (value)
        {
            if (!this.dialog) return;
            if (value != null)
                this.dialog.css({ top: value });
        },
        _setWidth: function (value)
        {
            if (!this.dialog) return;
            if (value >= this._borderX)
            {
                this.dialog.body.width(value - this._borderX);
            }
        },
        _setHeight: function (value)
        {
            var g = this, p = this.options;
            if (!this.dialog) return;
            if (value == "auto")
            {
                g.dialog.content.height('auto');
            } else if (value >= this._borderY)
            {
                var height = value - this._borderY - g.dialog.buttons.outerHeight();
                if (g.trigger('ContentHeightChange', [height]) == false) return;
                g.dialog.content.height(height);
                g.trigger('ContentHeightChanged', [height]);
            }
        },
        _setShowMax: function (value)
        {
            var g = this, p = this.options;
            if (value)
            {
                if (!g.winmax)
                {
                    g.winmax = $('<div class="l-dialog-winbtn l-dialog-max"></div>').appendTo(g.dialog.winbtns)
                    .hover(function ()
                    {
                        if ($(this).hasClass("l-dialog-recover"))
                            $(this).addClass("l-dialog-recover-over");
                        else
                            $(this).addClass("l-dialog-max-over");
                    }, function ()
                    {
                        $(this).removeClass("l-dialog-max-over l-dialog-recover-over");
                    }).click(function ()
                    {
                        if ($(this).hasClass("l-dialog-recover"))
                            g.recover();
                        else
                            g.max();
                    });
                }
            }
            else if (g.winmax)
            {
                g.winmax.remove();
                g.winmax = null;
            }
            g._updateBtnsWidth();
        },
        _setShowMin: function (value)
        {
            var g = this, p = this.options;
            if (value)
            {
                if (!g.winmin)
                {
                    g.winmin = $('<div class="l-dialog-winbtn l-dialog-min"></div>').appendTo(g.dialog.winbtns)
                    .hover(function ()
                    {
                        $(this).addClass("l-dialog-min-over");
                    }, function ()
                    {
                        $(this).removeClass("l-dialog-min-over");
                    }).click(function ()
                    {
                        g.min();
                    });
                    l.win.addTask(g);
                }
            }
            else if (g.winmin)
            {
                g.winmin.remove();
                g.winmin = null;
            }
            g._updateBtnsWidth();
        },
        _setShowToggle: function (value)
        {
            var g = this, p = this.options;
            if (value)
            {
                if (!g.wintoggle)
                {
                    g.wintoggle = $('<div class="l-dialog-winbtn l-dialog-collapse"></div>').appendTo(g.dialog.winbtns)
                   .hover(function ()
                   {
                       if ($(this).hasClass("l-dialog-toggle-disabled")) return;
                       if ($(this).hasClass("l-dialog-extend"))
                           $(this).addClass("l-dialog-extend-over");
                       else
                           $(this).addClass("l-dialog-collapse-over");
                   }, function ()
                   {
                       $(this).removeClass("l-dialog-extend-over l-dialog-collapse-over");
                   }).click(function ()
                   {
                       if ($(this).hasClass("l-dialog-toggle-disabled")) return;
                       if (g.wintoggle.hasClass("l-dialog-extend"))
                       {
                           if (g.trigger('extend') == false) return;
                           g.wintoggle.removeClass("l-dialog-extend");
                           g.extend();
                           g.trigger('extended');
                       }
                       else
                       {
                           if (g.trigger('collapse') == false) return;
                           g.wintoggle.addClass("l-dialog-extend");
                           g.collapse();
                           g.trigger('collapseed')
                       }
                   });
                }
            }
            else if (g.wintoggle)
            {
                g.wintoggle.remove();
                g.wintoggle = null;
            }
        },
        //按下回车
        enter: function ()
        {
            var g = this, p = this.options;
            var isClose;
            if (p.closeWhenEnter != undefined)
            {
                isClose = p.closeWhenEnter;
            }
            else if (p.type == "warn" || p.type == "error" || p.type == "success" || p.type == "question")
            {
                isClose = true;
            }
            if (isClose)
            {
                g.close();
            }
        },
        esc: function ()
        {

        },
        _removeDialog: function ()
        {
            var g = this, p = this.options;
            if (p.showType && p.fixedType)
            {
                g.dialog.animate({ bottom: -1 * p.height }, function ()
                {
                    remove();
                });
            }
            else
            {
                remove();
            }
            function remove()
            {
                var jframe = $('iframe', g.dialog);
                if (jframe.length)
                {
                    var frame = jframe[0];
                    frame.src = "about:blank";
                    if (frame.contentWindow && frame.contentWindow.document)
                    { 
                        try
                        {
                            frame.contentWindow.document.write('');
                        } catch (e)
                        {
                        }
                    }
                    $.browser.msie && CollectGarbage();
                    jframe.remove();
                }
                g.dialog.remove();
            }
        },
        close: function ()
        {
            var g = this, p = this.options;
            if (g.trigger('Close') == false) return;
            g.doClose();
            if (g.trigger('Closed') == false) return;
        },
        doClose: function ()
        {
            var g = this, p = this.options;
           
            l.win.removeTask(this);
            $.zoeui.remove(this);
            g.unmask();
            g._removeDialog();
            $('body').unbind('keydown.dialog');
            //在关闭dialog的情况下，关闭验证弹出提示   
            try{
                var form = p.form;
                if(form != null){
                    form.hideTip();
                }
            }catch(error){
                return;
            }
        },
        _getVisible: function ()
        {
            return this.dialog.is(":visible");
        },
        _setUrl: function (url)
        {
            var g = this, p = this.options;
            p.url = url;
            if (p.load)
            {
                g.dialog.body.html("").load(p.url, function ()
                {
                    g.trigger('loaded');
                });
            }
            else if (g.jiframe)
            {
                g.jiframe.attr("src", p.url);
            }
        },
        _setContent: function (content)
        {
            this.dialog.content.html(content);
        },
        _setTitle: function (value)
        {
            var g = this; var p = this.options;
            if (value)
            {
                $(".l-dialog-title", g.dialog).html(value);
            }
        },
        _hideDialog: function ()
        {
            var g = this, p = this.options;
            if (p.showType && p.fixedType)
            {
                g.dialog.animate({ bottom: -1 * p.height }, function ()
                {
                    g.dialog.hide();
                });
            } else
            {
                g.dialog.hide();
            }
        },
        hidden: function ()
        {
            var g = this, p = this.options;
            /**
             * 在隐藏dialog的情况下，关闭验证弹出提示
             */
            var form = p.form;
            if(form != null){
                form.hideTip();
            }
            l.win.removeTask(g);
            g.dialog.hide();
            g.unmask();
            if($.isFunction(p.onHidden)){
                 p.onHidden();
            }
        },
        show: function ()
        {
            var g = this, p = this.options;
            g.mask();
            if (p.fixedType)
            {
                if (p.showType)
                {
                    g.dialog.css({ bottom: -1 * p.height }).addClass("l-dialog-fixed");
                    g.dialog.show().animate({ bottom: 0 });
                }
                else
                {
                    g.dialog.show().css({ bottom: 0 });
                }
            }
            else
            {
                g.dialog.show();
            }
            //前端显示 
            $.zoeui.win.setFront.zoeDefer($.zoeui.win, 100, [g]);
        },
        /**
         * 重新绑定dialog按钮
         * @param buttons 自定义按钮
         */
        setButtons: function(buttons){
            var g = this, p = this.options;
            p.buttons = buttons;
            //替换掉dialog原先渲染的button元素及事件
            $(".l-dialog-buttons-inner").replaceWith('<div class="l-dialog-buttons-inner"></div>');
            //重新渲染button元素及事件
            $(p.buttons).each(function (i, item)
            {
                var btn = $('<div class="l-dialog-btn"><div class="l-dialog-btn-l"></div><div class="l-dialog-btn-r"></div><div class="l-dialog-btn-inner"></div></div>');
                $(".l-dialog-btn-inner", btn).html(item.text);
                $(".l-dialog-buttons-inner", g.dialog.buttons).prepend(btn);
                item.width && btn.width(item.width);
                item.onclick && btn.click(function () { item.onclick(item, g, i) });
                item.cls && btn.addClass(item.cls);
            });
            $(".l-dialog-buttons-inner", g.dialog.buttons).append("<div class='l-clear'></div>");
        },
        setUrl: function (url)
        {
            this._setUrl(url);
        },
        _saveStatus: function ()
        {
            var g = this;
            g._width = g.dialog.body.width();
            g._height = g.dialog.body.height();
            var top = 0;
            var left = 0;
            if (!isNaN(parseInt(g.dialog.css('top'))))
                top = parseInt(g.dialog.css('top'));
            if (!isNaN(parseInt(g.dialog.css('left'))))
                left = parseInt(g.dialog.css('left'));
            g._top = top;
            g._left = left;
        },
        _applyDrag: function ()
        {
            var g = this, p = this.options;
            if ($.fn.zoeDrag)
            {
                g.draggable = g.dialog.zoeDrag({
                    handler: '.l-dialog-title', animate: false,
                    onStartDrag: function ()
                    {
                        l.win.setFront(g);
                        var mask = $("<div class='l-dragging-mask' style='display:block'></div>").height(g.dialog.height());
                        g.dialog.append(mask);
                        g.dialog.content.addClass('l-dialog-content-dragging');
                    },
                    onDrag: function (current, e)
                    {
                        var pageY = e.pageY || e.screenY;
                        if (pageY < 0) return false;
                    },
                    onStopDrag: function ()
                    {
                        g.dialog.find("div.l-dragging-mask:first").remove();
                        g.dialog.content.removeClass('l-dialog-content-dragging');
                        if (p.target)
                        {
                            var triggers1 = l.find($.zoeui.controls.DateEditor);
                            var triggers2 = l.find($.zoeui.controls.ComboBox);
                            //更新所有下拉选择框的位置
                            $($.merge(triggers1, triggers2)).each(function ()
                            {
                                if (this.updateSelectBoxPosition)
                                    this.updateSelectBoxPosition();
                            });
                        }
                        g._saveStatus();
                    }
                });
            }
        },
        _onReisze: function ()
        {
            var g = this, p = this.options;
            if (p.target)
            {
                var manager = $(p.target).zoe();
                if (!manager) manager = $(p.target).find(":first").zoe();
                if (!manager) return;
                var contentHeight = g.dialog.content.height();
                var contentWidth = g.dialog.content.width();
                manager.trigger('resize', [{ width: contentWidth, height: contentHeight }]);
            }
        },
        _applyResize: function ()
        {
            var g = this, p = this.options;
            if ($.fn.zoeResizable)
            {
                g.resizable = g.dialog.zoeResizable({
                    onStopResize: function (current, e)
                    {
                        var top = 0;
                        var left = 0;
                        if (!isNaN(parseInt(g.dialog.css('top'))))
                            top = parseInt(g.dialog.css('top'));
                        if (!isNaN(parseInt(g.dialog.css('left'))))
                            left = parseInt(g.dialog.css('left'));
                        if (current.diffLeft)
                        {
                            g.set({ left: left + current.diffLeft });
                        }
                        if (current.diffTop)
                        {
                            g.set({ top: top + current.diffTop });
                        }
                        if (current.newWidth)
                        {
                            g.set({ width: current.newWidth });
                            g.dialog.body.css({ width: current.newWidth - g._borderX });
                        }
                        if (current.newHeight)
                        {
                            g.set({ height: current.newHeight });
                        }
                        g._onReisze();
                        g._saveStatus();
                        g.trigger('stopResize');
                        return false;
                    }, animate: false
                });
            }
        },
        _setImage: function ()
        {
            var g = this, p = this.options;
            
            if (p.type)
            {
                $(".l-dialog-body", g.dialog).addClass("l-dialog-body-tips");
                if (p.type == 'success' || p.type == 'donne' || p.type == 'ok')
                {
                    $(".l-dialog-content", g.dialog).addClass("l-dialog-image-donne").show();
                    //g.dialog.content.css({ paddingLeft: 20, paddingBottom: 30 });
                }
                else if (p.type == 'error')
                {
                    $(".l-dialog-content", g.dialog).addClass("l-dialog-image-error").show();
                    //g.dialog.content.css({ paddingLeft: 20, paddingBottom: 30 });
                }
                else if (p.type == 'warn')
                {
                    $(".l-dialog-content", g.dialog).addClass("l-dialog-image-warn").show();
                   //g.dialog.content.css({ paddingLeft: 20, paddingBottom: 30 });
                }
                else if (p.type == 'question')
                {
                    $(".l-dialog-content", g.dialog).addClass("l-dialog-image-question").show();
                    //g.dialog.content.css({ paddingLeft: 20, paddingBottom: 30 });
                }
                
            }
        }
    });
    l.controls.Dialog.prototype.hide = l.controls.Dialog.prototype.hidden;


    $.fn.zoeDialog = function(){        
        return zoe.get($(this).attr('zoeuiid'));
    }
    $.zoeDialog.open = function (p)
    {
        if(!p.popupType){
            var l = $.zoeui;
            var sel;        
            var m = l.find("Dialog");
            var isNull = false;
            if(p.target){
                sel = p.target.selector;
                for (var i in m){
                    if(m[i].options.target && sel == m[i].options.target.selector){
                        isNull = true;
                        m[i].show();
                        break;
                    }
                }
            }else{
                for (var i in m){
                    if(m[i].options.content && p.content){
                        if(m[i].options.content == p.content){
                            isNull = true;
                            m[i].show();
                            break;
                        }
                    }
                }
            }
        }
        if(!isNull){
            return $.zoeDialog(p);
        }
    };
    $.zoeDialog.close = function ()
    {
        var dialogs = l.find(l.controls.Dialog.prototype.__getType());
        for (var i in dialogs)
        {
            var d = dialogs[i];
            d.destroy.zoeDefer(d, 5);
        }
        l.win.unmask();
    };
    $.zoeDialog.show = function (p)
    {
        var dialogs = l.find(l.controls.Dialog.prototype.__getType());
        if (dialogs.length)
        {
            for (var i in dialogs)
            {
                dialogs[i].show();
                return;
            }
        }
        return $.zoeDialog(p);
    };
    $.zoeDialog.hide = function ()
    {
        var dialogs = l.find(l.controls.Dialog.prototype.__getType());
        for (var i in dialogs)
        {
            var d = dialogs[i];
            d.hide();
        }
    };
    $.zoeDialog.tip = function (options)
    {
        options = $.extend({
            showType: 'slide',
            width: 240,
            modal: false,
            height: 100
        }, options || {});

        $.extend(options, {
            fixedType: 'se',
            type: 'none',
            isDrag: false,
            isResize: false,
            showMax: false,
            showToggle: false,
            showMin: false
        });
        return $.zoeDialog.open(options);
    };
    $.zoeDialog.alert = function (content, title, type, callback, options)
    {
        content = content || "";
        if (typeof (title) == "function")
        {
            callback = title;
            type = null;
        }
        else if (typeof (type) == "function")
        {
            callback = type;
        }
        var btnclick = function (item, Dialog, index)
        {
            Dialog.close();
            if (callback)
                callback(item, Dialog, index);
        };
        p = {
            content: content,
            buttons: [{ text: $.zoeDefaults.DialogString.ok, onclick: btnclick }]
        };
        if (typeof (title) == "string" && title != "") p.title = title;
        if (typeof (type) == "string" && type != "") p.type = type;
        $.extend(p, {
            showMax: false,
            showToggle: false,
            showMin: false
        }, options || {});
        return $.zoeDialog(p);
    };

    $.zoeDialog.confirm = function (content, title, callback)
    {
        if (typeof (title) == "function")
        {
            callback = title;
            type = null;
        }
        var btnclick = function (item, Dialog)
        {
            Dialog.close();
            if (callback)
            {
                callback(item.type == 'ok');
            }
        };
        p = {
            type: 'question',
            content: content,
            buttons: [{ text: $.zoeDefaults.DialogString.yes, onclick: btnclick, type: 'ok' }, { text: $.zoeDefaults.DialogString.no, onclick: btnclick, type: 'no' }]
        };
        if (typeof (title) == "string" && title != "") p.title = title;
        $.extend(p, {
            showMax: false,
            showToggle: false,
            showMin: false
        });
        return $.zoeDialog(p);
    };
    $.zoeDialog.warning = function (content, title, callback, options)
    {
        if (typeof (title) == "function")
        {
            callback = title;
            type = null;
        }
        var btnclick = function (item, Dialog)
        {
            Dialog.close();
            if (callback)
            {
                callback(item.type);
            }
        };
        p = {
            type: 'question',
            content: content,
            buttons: [{ text: $.zoeDefaults.DialogString.yes, onclick: btnclick, type: 'yes' }, { text: $.zoeDefaults.DialogString.no, onclick: btnclick, type: 'no' }, { text: $.zoeDefaults.DialogString.cancel, onclick: btnclick, type: 'cancel' }]
        };
        if (typeof (title) == "string" && title != "") p.title = title;
        $.extend(p, {
            showMax: false,
            showToggle: false,
            showMin: false
        }, options || {});
        return $.zoeDialog(p);
    };
    $.zoeDialog.waitting = function (title,ec)
    {
        title = title || $.zoeDefaults.Dialog.waittingMessage;
        if(ec){ 
            return $.zoeDialog.open({ cls: 'l-dialog-waittingdialog-diy', type: 'waitting', content: '<div class="l-dialog-waittingdialog-diy-image"></div>', allowClose: false });
        }else{
            return $.zoeDialog.open({ cls: 'l-dialog-waittingdialog', type: 'none', content: '<div style="padding:12px">' + title + '</div>', allowClose: false });
        }
    };
    $.zoeDialog.closeWaitting = function ()
    {
        var dialogs = l.find(l.controls.Dialog);
        for (var i in dialogs)
        {
            var d = dialogs[i];
            if (d.dialog.hasClass("l-dialog-waittingdialog")||d.dialog.hasClass("l-dialog-waittingdialog-diy"))
                d.close();
        }
    };
    $.zoeDialog.success = function (content, title, onBtnClick, options)
    {
        return $.zoeDialog.alert(content, title, 'success', onBtnClick, options);
    };
    $.zoeDialog.error = function (content, title, onBtnClick, options)
    {
        return $.zoeDialog.alert(content, title, 'error', onBtnClick, options);
    };
    $.zoeDialog.warn = function (content, title, onBtnClick, options)
    {
        return $.zoeDialog.alert(content, title, 'warn', onBtnClick, options);
    };
    $.zoeDialog.question = function (content, title, options)
    {
        return $.zoeDialog.alert(content, title, 'question', null, options);
    };


    $.zoeDialog.prompt = function (title, value, multi, callback)
    {
        var target = $('<input type="text" class="l-dialog-inputtext"/>');
        if (typeof (multi) == "function")
        {
            callback = multi;
        }
        if (typeof (value) == "function")
        {
            callback = value;
        }
        else if (typeof (value) == "boolean")
        {
            multi = value;
        }
        if (typeof (multi) == "boolean" && multi)
        {
            target = $('<textarea class="l-dialog-textarea"></textarea>');
        }
        if (typeof (value) == "string" || typeof (value) == "int")
        {
            target.val(value);
        }
        var btnclick = function (item, Dialog, index)
        {
            Dialog.close();
            if (callback)
            {
                callback(item.type == 'yes', target.val());
            }
        }
        p = {
            title: title,
            target: target,
            width: 320,
            buttons: [{ text: $.zoeDefaults.DialogString.ok, onclick: btnclick, type: 'yes' }, { text: $.zoeDefaults.DialogString.cancel, onclick: btnclick, type: 'cancel' }]
        };
        return $.zoeDialog(p);
    };


})(jQuery);﻿

/**
* jQuery zoeUI 1.0.0
* 
* zoeDrag
* 
*/

(function ($)
{
    var l = $.zoeui;

    $.fn.zoeDrag = function (options)
    {
        return l.run.call(this, "zoeDrag", arguments,
        {
            idAttrName: 'zoeuidragid', hasElement: false, propertyToElemnt: 'target'
        }
        );
    };

    $.fn.zoeGetDragManager = function ()
    {
        return l.run.call(this, "zoeGetDragManager", arguments,
        {
            idAttrName: 'zoeuidragid', hasElement: false, propertyToElemnt: 'target'
        });
    };

    $.zoeDefaults.Drag = {
        onStartDrag: false,
        onDrag: false,
        onStopDrag: false,
        handler: null,
        //代理 拖动时的主体,可以是'clone'或者是函数,放回jQuery 对象
        proxy: true,
        revert: false,
        animate: true,
        onRevert: null,
        onEndRevert: null,
        //接收区域 jQuery对象或者jQuery选择字符
        receive: null,
        //进入区域
        onDragEnter: null,
        //在区域移动
        onDragOver: null,
        //离开区域
        onDragLeave: null,
        //在区域释放
        onDrop: null,
        disabled: false,
        proxyX: null,     //代理相对鼠标指针的位置,如果不设置则对应target的left
        proxyY: null
    };


    l.controls.Drag = function (options)
    {
        l.controls.Drag.base.constructor.call(this, null, options);
    };

    l.controls.Drag.zoeExtend(l.core.UIComponent, {
        __getType: function ()
        {
            return 'Drag';
        },
        __idPrev: function ()
        {
            return 'Drag';
        },
        _render: function ()
        {
            var g = this, p = this.options;
            this.set(p);
            g.cursor = "move";
            g.handler.css('cursor', g.cursor);
            g.handler.bind('mousedown.drag', function (e)
            {
                if (p.disabled) return;
                if (e.button == 2) return;
                g._start.call(g, e);
            }).bind('mousemove.drag', function ()
            {
                if (p.disabled) return;
                g.handler.css('cursor', g.cursor);
            });
        },
        _rendered: function ()
        {
            this.options.target.zoeuidragid = this.id;
        },
        _start: function (e)
        {
            var g = this, p = this.options;
            if (g.reverting) return;
            if (p.disabled) return;
            g.current = {
                target: g.target,
                left: g.target.offset().left,
                top: g.target.offset().top,
                startX: e.pageX || e.screenX,
                startY: e.pageY || e.clientY
            };
            if (g.trigger('startDrag', [g.current, e]) == false) return false;
            g.cursor = "move";
            g._createProxy(p.proxy, e);
            //代理没有创建成功
            if (p.proxy && !g.proxy) return false;
            (g.proxy || g.handler).css('cursor', g.cursor);
            $(document).bind("selectstart.drag", function () { return false; });
            $(document).bind('mousemove.drag', function ()
            {
                g._drag.apply(g, arguments);
            });
            l.draggable.dragging = true;
            $(document).bind('mouseup.drag', function ()
            {
                l.draggable.dragging = false;
                g._stop.apply(g, arguments);
            });
        },
        _drag: function (e)
        {
            var g = this, p = this.options;
            if (!g.current) return;
            var pageX = e.pageX || e.screenX;
            var pageY = e.pageY || e.screenY;
            g.current.diffX = pageX - g.current.startX;
            g.current.diffY = pageY - g.current.startY;
            (g.proxy || g.handler).css('cursor', g.cursor);
            if (g.receive)
            {
                g.receive.each(function (i, obj)
                {
                    var receive = $(obj);
                    var xy = receive.offset();
                    if (pageX > xy.left && pageX < xy.left + receive.width()
                    && pageY > xy.top && pageY < xy.top + receive.height())
                    {
                        if (!g.receiveEntered[i])
                        {
                            g.receiveEntered[i] = true;
                            g.trigger('dragEnter', [obj, g.proxy || g.target, e]);
                        }
                        else
                        {
                            g.trigger('dragOver', [obj, g.proxy || g.target, e]);
                        }
                    }
                    else if (g.receiveEntered[i])
                    {
                        g.receiveEntered[i] = false;
                        g.trigger('dragLeave', [obj, g.proxy || g.target, e]);
                    }
                });
            }
            if (g.hasBind('drag'))
            {
                if (g.trigger('drag', [g.current, e]) != false)
                {
                    g._applyDrag();
                }
                else
                {
                    if (g.proxy)
                    {
                        g._removeProxy();
                    } else
                    {
                        g._stop();
                    }
                }
            }
            else
            {
                g._applyDrag();
            }
        },
        _stop: function (e)
        {
            var g = this, p = this.options;
            $(document).unbind('mousemove.drag');
            $(document).unbind('mouseup.drag');
            $(document).unbind("selectstart.drag");
            if (g.receive)
            {
                g.receive.each(function (i, obj)
                {
                    if (g.receiveEntered[i])
                    {
                        g.trigger('drop', [obj, g.proxy || g.target, e]);
                    }
                });
            }
            if (g.proxy)
            {
                if (p.revert)
                {
                    if (g.hasBind('revert'))
                    {
                        if (g.trigger('revert', [g.current, e]) != false)
                            g._revert(e);
                        else
                            g._removeProxy();
                    }
                    else
                    {
                        g._revert(e);
                    }
                }
                else
                {
                    g._applyDrag(g.target);
                    g._removeProxy();
                }
            }
            g.cursor = 'move';
            g.trigger('stopDrag', [g.current, e]);
            g.current = null;
            g.handler.css('cursor', g.cursor);
        },
        _revert: function (e)
        {
            var g = this;
            g.reverting = true;
            g.proxy.animate({
                left: g.current.left,
                top: g.current.top
            }, function ()
            {
                g.reverting = false;
                g._removeProxy();
                g.trigger('endRevert', [g.current, e]);
                g.current = null;
            });
        },
        _applyDrag: function (applyResultBody)
        {
            var g = this, p = this.options;
            applyResultBody = applyResultBody || g.proxy || g.target;
            var cur = {}, changed = false;
            var noproxy = applyResultBody == g.target;
            if (g.current.diffX)
            {
                if (noproxy || p.proxyX == null)
                    cur.left = g.current.left + g.current.diffX;
                else
                    cur.left = g.current.startX + p.proxyX + g.current.diffX;
                changed = true;
            }
            if (g.current.diffY)
            {
                if (noproxy || p.proxyY == null)
                    cur.top = g.current.top + g.current.diffY;
                else
                    cur.top = g.current.startY + p.proxyY + g.current.diffY;
                changed = true;
            }
            //超过屏幕是否移动
            if(!p.isOver){
                var ww = $(window).width()-g.target.context.offsetWidth;
                var wh = $(window).height()-g.target.context.offsetHeight;
                if(cur.top < 0){
                    cur.top = 0;
                }
                if(cur.top > wh){
                    cur.top = wh;
                }
                if(cur.left < 0){
                    cur.left = 0;
                }
                if(cur.left > ww){
                    cur.left = ww;
                }               
            }
            if (applyResultBody == g.target && g.proxy && p.animate)
            {
                g.reverting = true;
                applyResultBody.animate(cur, function ()
                {
                    g.reverting = false;
                });
            }
            else
            {
                applyResultBody.css(cur);
            }
        },
        _setReceive: function (receive)
        {
            this.receiveEntered = {};
            if (!receive) return;
            if (typeof receive == 'string')
                this.receive = $(receive);
            else
                this.receive = receive;
        },
        _setHandler: function (handler)
        {
            var g = this, p = this.options;
            if (!handler)
                g.handler = $(p.target);
            else
                g.handler = (typeof handler == 'string' ? $(handler, p.target) : handler);
        },
        _setTarget: function (target)
        {
            this.target = $(target);
        },
        _setCursor: function (cursor)
        {
            this.cursor = cursor;
            (this.proxy || this.handler).css('cursor', cursor);
        },
        _createProxy: function (proxy, e)
        {
            if (!proxy) return;
            var g = this, p = this.options;
            if (typeof proxy == 'function')
            {
                g.proxy = proxy.call(this.options.target, g, e);
            }
            else if (proxy == 'clone')
            {
                g.proxy = g.target.clone().css('position', 'absolute');
                g.proxy.appendTo('body');
            }
            else
            {
                g.proxy = $("<div class='l-draggable'></div>");
                g.proxy.width(g.target.width()).height(g.target.height())
                g.proxy.attr("dragid", g.id).appendTo('body');
            }
            g.proxy.css({
                left: p.proxyX == null ? g.current.left : g.current.startX + p.proxyX,
                top: p.proxyY == null ? g.current.top : g.current.startY + p.proxyY
            }).show();
        },
        _removeProxy: function ()
        {
            var g = this;
            if (g.proxy)
            {
                g.proxy.remove();
                g.proxy = null;
            }
        }

    });

})(jQuery);﻿

/**
* jQuery zoeUI 1.0.0
* 
* zoeGrid 表格组件
*/

(function ($)
{
    var l = $.zoeui;

    $.fn.zoeGrid = function (options)
    {
        return $.zoeui.run.call(this, "zoeGrid", arguments);
    };

    $.fn.zoeGetGridManager = function ()
    {
        return $.zoeui.run.call(this, "zoeGetGridManager", arguments);
    };

    $.zoeDefaults.Grid = {
        title: null,
        width: 'auto',                          //宽度值
        height: 'auto',                          //宽度值
        columnWidth: null,                      //默认列宽度
        resizable: true,                        //table是否可伸缩
        url: false,                             //ajax url
        data: null,                            //初始化数据
        usePager: true,                         //是否分页
        page: 1,                                //默认当前页 
        pageSize: 10,                           //每页默认的结果数
        pageSizeOptions: [10, 20, 30, 40, 50],  //可选择设定的每页结果数
        parms: [],                         //提交到服务器的参数
        columns: [],                          //数据源
        minColToggle: 1,                        //最小显示的列
        dataType: 'server',                     //数据源：本地(local)或(server),本地是将读取p.data。不需要配置，取决于设置了data或是url
        dataAction: 'server',                    //提交数据的方式：本地(local)或(server),选择本地方式时将在客服端分页、排序。 
        showTableToggleBtn: false,              //是否显示'显示隐藏Grid'按钮 
        switchPageSizeApplyComboBox: false,     //切换每页记录数是否应用zoeComboBox
        allowAdjustColWidth: true,              //是否允许调整列宽     
        checkbox: false,                         //是否显示复选框
        allowHideColumn: false,                 //是否显示'切换列层'按钮
        enabledEdit: false,                      //是否允许编辑
        isScroll: true,                         //是否滚动 
        dateFormat: 'yyyy-MM-dd',              //默认时间显示格式
        inWindow: true,                        //是否以窗口的高度为准 height设置为百分比时可用
        statusName: '__status',                    //状态名
        method: 'post',                         //获取数据http方式
        async: true,
        fixedCellHeight: true,                       //是否固定单元格的高度
        heightDiff: 0,                         //高度补差,当设置height:100%时，可能会有高度的误差，可以通过这个属性调整
        cssClass: null,                    //类名
        root: 'rows',                       //数据源字段名
        record: 'total',                     //数据源记录数字段名
        pageParmName: 'page',               //页索引参数名，(提交给服务器)
        pagesizeParmName: 'pagesize',        //页记录数参数名，(提交给服务器)
        sortnameParmName: 'sortname',        //页排序列名(提交给服务器)
        sortorderParmName: 'sortorder',      //页排序方向(提交给服务器) 
        allowUnSelectRow: false,           //是否允许反选行 
        alternatingRow: true,           //奇偶行效果
        groupsAlterNatingRow:false,     //分组奇偶行效果
        mouseoverRowCssClass: 'l-grid-row-over',
        enabledSort: true,                      //是否允许排序
        rowAttrRender: null,                  //行自定义属性渲染器(包括style，也可以定义)
        groupColumnName: null,                 //分组 - 列名
        groupNewRowName:null,          //新增小结行
        groupNewRowRender:null,     //分组自定义行
        groupColumnDisplay: '分组',             //分组 - 列显示名字
        groupRender: null,                     //分组 - 渲染器
        totalRender: null,                       //统计行(全部数据)
        delayLoad: false,                        //初始化时是否不加载
        where: null,                           //数据过滤查询函数,(参数一 data item，参数二 data item index)
        selectRowButtonOnly: false,            //复选框模式时，是否只允许点击复选框才能选择行 
        whenRClickToSelect: false,                //右击行时是否选中
        contentType: null,                     //Ajax contentType参数
        checkboxColWidth: 27,                  //复选框列宽度
        detailColWidth: 29,                     //明细列宽度
        clickToEdit: true,                      //是否点击单元格的时候就编辑
        detailToEdit: false,                     //是否点击明细的时候进入编辑
        onEndEdit: null,
        minColumnWidth: 80,
        tree: null,                            //treeGrid模式
        isChecked: null,                       //复选框 初始化函数
        isSelected: null,                       //选择 初始化函数
        frozen: true,                          //是否固定列
        frozenDetail: false,                    //明细按钮是否在固定列中
        frozenCheckbox: true,                  //复选框按钮是否在固定列中
        detail: null,
        detailHeight: 260,
        isShowDetailToggle: null,                  //是否显示展开/收缩明细的判断函数
        rownumbers: false,                         //是否显示行序号
        frozenRownumbers: true,                  //行序号是否在固定列中
        rownumbersColWidth: 26,
        colDraggable: false,                       //是否允许表头拖拽
        rowDraggable: false,                         //是否允许行拖拽
        rowDraggingRender: null,
        autoCheckChildren: true,                  //是否自动选中子节点
        onRowDragDrop: null,                    //行拖拽事件
        rowHeight: 28,                           //行默认的高度
        headerRowHeight: 28,                    //表头行的高度
        toolbar: null,                           //工具条,参数同 zoeToolbar的,额外参数有title、icon
        toolbarShowInLeft: true,               //工具条显示在左边
        headerImg: null,                        //表格头部图标  
        editorTopDiff: 0,                      //编辑器top误差
        unSetValidateAttr: true,             //是否不设置validate属性到inuput
        autoFilter: false,                    //自动生成高级查询, 需要filter/toolbar组件支持. 需要引用skins/zoeui-icons.css
        onDragCol: null,                       //拖动列事件
        onToggleCol: null,                     //切换列事件
        onChangeSort: null,                    //改变排序事件
        onSuccess: null,                       //成功获取服务器数据的事件
        onDblClickRow: null,                     //双击行事件
        onSelectRow: null,                    //选择行事件
        onUnSelectRow: null,                   //取消选择行事件
        onBeforeCheckRow: null,                 //选择前事件，可以通过return false阻止操作(复选框)
        onCheckRow: null,                    //选择事件(复选框) 
        onBeforeCheckAllRow: null,              //选择前事件，可以通过return false阻止操作(复选框 全选/全不选)
        onCheckAllRow: null,                    //选择事件(复选框 全选/全不选)onextend
        onBeforeShowData: null,                  //显示数据前事件，可以通过reutrn false阻止操作
        onAfterShowData: null,                 //显示完数据事件
        rowSelectable:true,                 //是否可选择
        onBeforeSelectRow:null,             //选择前事件
        onError: null,                         //错误事件
        onSubmit: null,                         //提交前事件
        onReload: null,                    //刷新事件，可以通过return false来阻止操作
        onToFirst: null,                     //第一页，可以通过return false来阻止操作
        onToPrev: null,                      //上一页，可以通过return false来阻止操作
        onToNext: null,                      //下一页，可以通过return false来阻止操作
        onToLast: null,                      //最后一页，可以通过return false来阻止操作
        onAfterAddRow: null,                     //增加行后事件
        onBeforeEdit: null,                      //编辑前事件
        onBeforeSubmitEdit: null,               //验证编辑器结果是否通过
        onAfterEdit: null,                       //结束编辑后事件
        onLoading: null,                        //加载时函数
        onLoaded: null,                          //加载完函数
        onContextmenu: null,                   //右击事件
        onBeforeCancelEdit: null,                 //取消编辑前事件
        onAfterSubmitEdit: null,                   //提交后事件
        onRowDragDrop: null,                       //行拖拽后事件
        onGroupExtend: null,                        //分组展开事件
        onGroupCollapse: null,                     //分组收缩事件
        onTreeExpand: null,                        //树展开事件
        onTreeCollapse: null,                     //树收缩事件
        onTreeExpanded: null,                        //树展开事件
        onTreeCollapsed: null,                     //树收缩事件
        onLoadData: null,                       //加载数据前事件
        pageDialog:true,                       //页面超出是否弹窗提示
        deleteSelectedRowAfter:null,          //删除选择行之后事件
        updateSelectedRowAfter:null,           //更新选择行之后事件
        endRowAfter:null,                      //编辑选择行之后事件
        isNull:false,                           //获取行数据是否判空
        isNewPage:null,                        //加载数据是否更新页码，如：1
        isNullMes:null,                       //当加载数据空时有提示信息，有的话写出要的提示信息
        isDetailBtn: false,             //明细列是否要默认的按钮
        isDetailOneShow:true,           //明细点击是否显示一个（只适用于点击行的时候）
        detailRowClick: true            //行是否支持行明细单击事件
    };
    $.zoeDefaults.GridString = {
        errorMessage: '发生错误',
        pageStatMessage: '共 {total} 条',
        pageTextMessage: 'Page',
        loadingMessage: '加载中...',
        findTextMessage: '查找',
        noRecordMessage: '没有符合条件的记录存在',
        isContinueByDataChanged: '数据已经改变,如果继续将丢失数据,是否继续?',
        cancelMessage: '取消',
        saveMessage: '保存',
        applyMessage: '应用',
        draggingMessage: '{count}行'
    };

    $.zoeDefaults.Grid_columns = {
        id: null,
        name: null,
        totalSummary: null,
        display: null,
        headerRender: null,
        isAllowHide: true,
        isSort: false,
        type: null,
        columns: null,
        width: 120,
        minWidth: 80,
        format: null,
        align: 'left',
        hide: false,
        editor: null,
        render: null,
        enabledCustom:false, //下拉检索不到数据时是否以输入值为结果
        textField: null,  //真正显示的字段名,如果设置了，在编辑状态时,会调用创建编辑器的setText和getText方法
        isKey: false,
        isColumNull:false,      //获得数据时是否判空    
        isDblClickEven:true,    //双击事情是否冒泡，双击之后不会触发行事件
        isMust:false   //是否是必填的，是的话背景色改变
    };
    $.zoeDefaults.Grid_editor = {
        type: null,
        isContrast: null, //是否匹配数据
        toFixed:null, //float或者number类型的精确要小数点的几位，如1位写1
        ext: null,
        onChange: null,
        onChanged: null
    };
    //接口方法扩展
    $.zoeMethos.Grid = $.zoeMethos.Grid || {};

    //排序器扩展
    $.zoeDefaults.Grid.sorters = $.zoeDefaults.Grid.sorters || {};

    //格式化器扩展
    $.zoeDefaults.Grid.formatters = $.zoeDefaults.Grid.formatters || {};

    //编辑器扩展
    $.zoeDefaults.Grid.editors = $.zoeDefaults.Grid.editors || {};


    $.zoeDefaults.Grid.sorters['date'] = function (val1, val2)
    {
        return val1 < val2 ? -1 : val1 > val2 ? 1 : 0;
    };
    $.zoeDefaults.Grid.sorters['int'] = function (val1, val2)
    {
        return parseInt(val1) < parseInt(val2) ? -1 : parseInt(val1) > parseInt(val2) ? 1 : 0;
    };
    $.zoeDefaults.Grid.sorters['float'] = function (val1, val2)
    {
        return parseFloat(val1) < parseFloat(val2) ? -1 : parseFloat(val1) > parseFloat(val2) ? 1 : 0;
    };
    $.zoeDefaults.Grid.sorters['string'] = function (val1, val2)
    {
        if (!val1) return false;
        return val1.localeCompare(val2);
    };


    $.zoeDefaults.Grid.formatters['date'] = function (value, column)
    {
        function getFormatDate(date, dateformat)
        {
            var g = this, p = this.options;
            if (isNaN(date)) return null;
            var format = dateformat;
            var o = {
                "M+": date.getMonth() + 1,
                "d+": date.getDate(),
                "h+": date.getHours(),
                "m+": date.getMinutes(),
                "s+": date.getSeconds(),
                "q+": Math.floor((date.getMonth() + 3) / 3),
                "S": date.getMilliseconds()
            }
            if (/(y+)/.test(format))
            {
                format = format.replace(RegExp.$1, (date.getFullYear() + "")
            .substr(4 - RegExp.$1.length));
            }
            for (var k in o)
            {
                if (new RegExp("(" + k + ")").test(format))
                {
                    format = format.replace(RegExp.$1, RegExp.$1.length == 1 ? o[k]
                : ("00" + o[k]).substr(("" + o[k]).length));
                }
            }
            return format;
        }
        if (!value) return "";
        // /Date(1328423451489)/
        if (typeof (value) == "string" && /^\/Date/.test(value))
        {
            value = value.replace(/^\//, "new ").replace(/\/$/, "");
            eval("value = " + value);
        } 
        if (value instanceof Date)
        {
            var format = column.format || this.options.dateFormat || "yyyy-MM-dd";
            return getFormatDate(value, format);
        }
        else
        {
            return value.toString();
        }
    }

    $.zoeui.controls.Grid = function (element, options)
    {
        $.zoeui.controls.Grid.base.constructor.call(this, element, options);
    };

    $.zoeui.controls.Grid.zoeExtend($.zoeui.core.UIComponent, {
        __getType: function ()
        {
            return 'Grid';
        },
        __idPrev: function ()
        {
            return 'grid';
        },
        _extendMethods: function ()
        {
            return $.zoeMethos.Grid;
        },
        _init: function ()
        {
            $.zoeui.controls.Grid.base._init.call(this);
            var g = this, p = this.options;
            p.dataType = p.url ? "server" : "local";
            if (p.dataType == "local")
            {
                p.data = p.data || [];
                p.dataAction = "local";
            }
            if (p.isScroll == false)
            {
                p.height = 'auto';
            }
            if (!p.frozen)
            {
                p.frozenCheckbox = false;
                p.frozenDetail = false;
                p.frozenRownumbers = false;
            }
            if (p.detailToEdit)
            {
                p.enabledEdit = true;
                p.clickToEdit = false;
                p.detail = {
                    height: 'auto',
                    onShowDetail: function (record, container, callback)
                    {
                        $(container).addClass("l-grid-detailpanel-edit");
                        g.beginEdit(record, function (rowdata, column)
                        {
                            var editContainer = $("<div class='l-editbox'></div>");
                            editContainer.width(120).height(p.rowHeight + 1);
                            editContainer.appendTo(container);
                            return editContainer;
                        });
                        function removeRow()
                        {
                            $(container).parent().parent().remove();
                            g.collapseDetail(record);
                        }
                        $("<div class='l-clear'></div>").appendTo(container);
                        $("<div class='l-button'>" + p.saveMessage + "</div>").appendTo(container).click(function ()
                        {
                            g.endEdit(record);
                            removeRow();
                        });
                        $("<div class='l-button'>" + p.applyMessage + "</div>").appendTo(container).click(function ()
                        {
                            g.submitEdit(record);
                        });
                        $("<div class='l-button'>" + p.cancelMessage + "</div>").appendTo(container).click(function ()
                        {
                            g.cancelEdit(record);
                            removeRow();
                        });
                    }
                };
            }
            if (p.tree)//启用分页模式
            {
                p.tree.childrenName = p.tree.childrenName || "children";
                p.tree.isParent = p.tree.isParent || function (rowData)
                {
                    var exist = p.tree.childrenName in rowData;
                    // 叶子节点判空
                    var childArr = rowData[p.tree.childrenName];
                    if(childArr==null||childArr.length==0){
                        exist=false;
                    } 
                    return exist;
                };
                p.tree.isExtend = p.tree.isExtend || function (rowData)
                {
                    if ('isextend' in rowData && rowData['isextend'] == false)
                        return false;
                    return true;
                };
            }
            //编辑构造器初始化
            for (var type in zoe.editors)
            {
                var editor = zoe.editors[type];
                //如果没有默认的或者已经定义
                if (!editor || type in p.editors) continue;
                p.editors[type] = zoe.getEditor($.extend({
                    type: type,
                    master: g
                }, editor));
            }
        },
        _render: function ()
        {
            var g = this, p = this.options;
            g.grid = $(g.element);
            g.grid.addClass("l-panel");
            var gridhtmlarr = [];
            gridhtmlarr.push("        <div class='l-panel-header'><span class='l-panel-header-text'></span></div>");
            gridhtmlarr.push("                    <div class='l-grid-loading'></div>");
            gridhtmlarr.push("        <div class='l-panel-topbar' style='display:none'><div class='l-panel-topbarinner'></div></div><div class='l-clear'></div>");
            gridhtmlarr.push("        <div class='l-panel-bwarp'>");
            gridhtmlarr.push("            <div class='l-panel-body'>");
            gridhtmlarr.push("                <div class='l-grid'>");
            gridhtmlarr.push("                    <div class='l-grid-dragging-line'></div>");
            gridhtmlarr.push("                    <div class='l-grid-popup'><table cellpadding='0' cellspacing='0'><tbody></tbody></table></div>");

            gridhtmlarr.push("                  <div class='l-grid1'>");
            gridhtmlarr.push("                      <div class='l-grid-header l-grid-header1'>");
            gridhtmlarr.push("                          <div class='l-grid-header-inner'><table class='l-grid-header-table' cellpadding='0' cellspacing='0'><tbody></tbody></table></div>");
            gridhtmlarr.push("                      </div>");
            gridhtmlarr.push("                      <div class='l-grid-body l-grid-body1'>");
            gridhtmlarr.push("                      </div>");
            gridhtmlarr.push("                  </div>");

            gridhtmlarr.push("                  <div class='l-grid2'>");
            gridhtmlarr.push("                      <div class='l-grid-header l-grid-header2'>");
            gridhtmlarr.push("                          <div class='l-grid-header-inner'><table class='l-grid-header-table' cellpadding='0' cellspacing='0'><tbody></tbody></table></div>");
            gridhtmlarr.push("                      </div>");
            gridhtmlarr.push("                      <div class='l-grid-body l-grid-body2 l-scroll'>");
            gridhtmlarr.push("                      </div>");
            gridhtmlarr.push("                      <div class='l-grid-mes' style='display:none'>");
            gridhtmlarr.push("                      </div>");
            gridhtmlarr.push("                  </div>");
            gridhtmlarr.push("                 </div>");
            gridhtmlarr.push("              </div>");
            gridhtmlarr.push("         </div>");
            gridhtmlarr.push("         <div class='l-panel-bar'>");
            gridhtmlarr.push("            <div class='l-panel-bbar-inner'>");
            gridhtmlarr.push("                <div class='l-bar-group zoe-select-text-l ' >每页显示</div>");
            gridhtmlarr.push("                <div class='l-bar-group l-bar-selectpagesize'></div>");
            gridhtmlarr.push("                <div class='l-bar-group zoe-select-text-r  ' >条，</div>");
            gridhtmlarr.push("                <div class='l-bar-group l-bar-text'></div>");
            gridhtmlarr.push("                <div class='l-bar-group'>");
            gridhtmlarr.push("                    <div class='l-bar-button l-bar-btnfirst'><span></span></div>");
            gridhtmlarr.push("                    <div class='l-bar-button l-bar-btnprev'><span></span></div>");
            gridhtmlarr.push("                </div>");
            gridhtmlarr.push("                <div class='l-bar-group'><span class='pcontrol'> <input type='text' size='4' value='1' style='width:20px' maxlength='3' /> / <span></span></span></div>");
            gridhtmlarr.push("                <div class='l-bar-group'>");
            gridhtmlarr.push("                     <div class='l-bar-button l-bar-btnnext'><span></span></div>");
            gridhtmlarr.push("                    <div class='l-bar-button l-bar-btnlast'><span></span></div>");
            gridhtmlarr.push("                </div>");
            gridhtmlarr.push("                <div class='l-clear'></div>");
            gridhtmlarr.push("            </div>");
            gridhtmlarr.push("         </div>");
            g.grid.html(gridhtmlarr.join(''));
            //头部
            g.header = $(".l-panel-header:first", g.grid);
            //主体
            g.body = $(".l-panel-body:first", g.grid);
            //底部工具条         
            g.toolbar = $(".l-panel-bar:first", g.grid);
            //显示/隐藏列      
            g.popup = $(".l-grid-popup:first", g.grid);
            //加载中
            g.gridloading = $(".l-grid-loading:first", g.grid);
            //调整列宽层 
            g.draggingline = $(".l-grid-dragging-line", g.grid);
            //顶部工具栏
            g.topbar = $(".l-panel-topbarinner:first", g.grid);

            g.gridview = $(".l-grid:first", g.grid);
            g.gridview.attr("id", g.id + "grid");
            g.gridview1 = $(".l-grid1:first", g.gridview);
            g.gridview2 = $(".l-grid2:first", g.gridview);
            //表头     
            g.gridheader = $(".l-grid-header:first", g.gridview2);
            //表主体     
            g.gridbody = $(".l-grid-body:first", g.gridview2);
            g.gridmes = $(".l-grid-mes:first", g.gridview2);
            //处理autoFilter
            if (p.autoFilter)
            {
                var item = {
                    text: '高级查询',
                    gridid: g.id,
                    click: function ()
                    {
                        g.showFilter();
                    },
                    icon: 'search2'
                };
                if (p.toolbar && p.toolbar.items)
                {
                    p.toolbar.items.push(item);
                }
                else
                {
                    p.toolbar = {
                        items: [item]
                    };
                }
            }
            //frozen
            g.f = {};
            //表头     
            g.f.gridheader = $(".l-grid-header:first", g.gridview1);
            //表主体     
            g.f.gridbody = $(".l-grid-body:first", g.gridview1);

            g.currentData = null;
            g.changedCells = {};
            g.editors = {};                 //多编辑器同时存在
            g.editor = { editing: false };  //单编辑器,配置clickToEdit

            g.cacheData = {}; //缓存数据

            if (p.height == "auto")
            {
                g.bind("SysGridHeightChanged", function ()
                {
                    if (g.enabledFrozen())
                        g.gridview.height(Math.max(g.gridview1.height(), g.gridview2.height()));
                });
            }

            var pc = $.extend({}, p);

            this._bulid();
            this._setColumns(p.columns);

            delete pc['columns'];
            delete pc['data'];
            delete pc['url'];
            g.set(pc);
            if (!p.delayLoad)
            {
                if (p.url)
                    g.set({ url: p.url });
                else if (p.data)
                    g.set({ data: p.data });
            } 
        },
        _setFrozen: function (frozen)
        {
            if (frozen)
                this.grid.addClass("l-frozen");
            else
                this.grid.removeClass("l-frozen");
        },
        _setCssClass: function (value)
        {
            this.grid.addClass(value);
        },
        _setLoadingMessage: function (value)
        {
            this.gridloading.html(value);
        },
        _setToolbar: function (value)
        {
            var g = this, p = this.options;
            if (value && $.fn.zoeToolBar)
            {
                g.topbar.parent().show();
                g.toolbarManager = g.topbar.zoeToolBar(value);
                if (value.title)
                {
                    var jtitle = $("<div class='l-panel-topbartitle'><span>" + value.title + "</span></div>");
                    if (value.icon)
                    {
                        jtitle.append("<img class='l-panel-topbaricon' src='" + value.icon + "'></img>");
                        jtitle.addClass("l-panel-topbartitle-hasicon");
                    }
                    g.topbar.parent().append(jtitle);
                }
                if (p.toolbarShowInLeft)
                {
                    g.topbar.addClass("l-panel-topbarinner-left");
                }
            } else
            {
                g.topbar.parent().remove();
            }
        },
        isHorizontalScrollShowed: function ()
        {
            var g = this;
            var inner = g.gridbody.find(".l-grid-body-inner:first");
            if (!inner.length) return false;
            //20为横向滚动条的宽度
            return g.gridbody.width() - 20 < inner.width();
        },
        _setHeight: function (h)
        {
            var g = this, p = this.options;
            g.unbind("SysGridHeightChanged");
            if (h == "auto")
            {
                g.bind("SysGridHeightChanged", function ()
                {
                    if (g.enabledFrozen())
                        g.gridview.height(Math.max(g.gridview1.height(), g.gridview2.height()));
                });
                return;
            }
            h = g._calculateGridBodyHeight(h);
            if (h > 0)
            {
                g.gridbody.height(h);
                g.f.gridbody.height(h);
                var gridHeaderHeight = p.headerRowHeight * (g._columnMaxLevel - 1) + p.headerRowHeight - 1;
                g.gridview.height(h + gridHeaderHeight);
            }
            g._updateHorizontalScrollStatus.zoeDefer(g, 10);
        },
        _calculateGridBodyHeight: function (h)
        {
            var g = this, p = this.options;
            if (typeof h == "string" && h.indexOf('%') > 0)
            {
                if (p.inWindow)
                    h = $(window).height() * parseInt(h) * 0.01;
                else
                    h = g.grid.parent().height() * parseInt(h) * 0.01;
            }
            if (p.title) h -= 24;
            if (p.usePager) h -= 32;
            if (p.totalRender) h -= 25;
            if (p.toolbar) h -= g.topbar.outerHeight();
            var gridHeaderHeight = p.headerRowHeight * (g._columnMaxLevel - 1) + p.headerRowHeight - 1;
            h -= gridHeaderHeight;
            return h;
        },
        _updateHorizontalScrollStatus: function ()
        {
            var g = this, p = this.options;
            if (g.isHorizontalScrollShowed())
            {
                g.gridview.addClass("l-grid-hashorizontal");
            }
            else
            {
                g.gridview.removeClass("l-grid-hashorizontal");
            }
        },
        _updateFrozenWidth: function ()
        {
            var g = this, p = this.options;
            if (g.enabledFrozen())
            {
                g.gridview1.width(g.f.gridtablewidth);
                var view2width = g.gridview.width() - g.f.gridtablewidth;
                g.gridview2.css({ left: g.f.gridtablewidth });
                if (view2width > 0) g.gridview2.css({ width: view2width });
            }
        },
        _setWidth: function (value)
        {
            var g = this, p = this.options;
            if (g.enabledFrozen()) g._onResize();
        },
        _setUrl: function (value)
        {
            this.options.url = value;
            if (value)
            {
                this.options.dataType = "server";
                this.loadData(true);
            }
            else
            {
                this.options.dataType = "local";
            }
        },
        removeParm: function (name)
        {
            var g = this;
            var parms = g.get('parms');
            if (!parms) parms = {};
            if (parms instanceof Array)
            {
                removeArrItem(parms, function (p) { return p.name == name; });
            } else
            {
                delete parms[name];
            }
            g.set('parms', parms);
        },
        setParm: function (name, value)
        {
            var g = this;
            var parms = g.get('parms');
            if (!parms) parms = {};
            if (parms instanceof Array)
            {
                removeArrItem(parms, function (p) { return p.name == name; });
                parms.push({ name: name, value: value });
            } else
            {
                parms[name] = value;
            }
            g.set('parms', parms);
        },
        _setData: function (value)
        {
            this.loadData(this.options.data);
        },
        //刷新数据
        loadData: function (loadDataParm)
        {
            var g = this, p = this.options;
            g.loading = true;
            g.trigger('loadData');
            var clause = null;
            var loadServer = true;
            if (typeof (loadDataParm) == "function")
            {
                clause = loadDataParm;
                if (g.lastData)
                {
                    g.data = g.lastData;
                } else
                {
                    g.data = g.currentData;
                    if (!g.data) g.data = {};
                    if (!g.data[p.root]) g.data[p.root] = [];
                    g.lastData = g.data;
                }
                loadServer = false;
            }
            else if (typeof (loadDataParm) == "boolean")
            {
                loadServer = loadDataParm;
            }
            else if (typeof (loadDataParm) == "object" && loadDataParm)
            {
                loadServer = false;
                p.dataType = "local";
                p.data = loadDataParm;
            }
            //参数初始化
            if (!p.newPage) p.newPage = 1;
            if (p.isNewPage){
                p.newPage = p.isNewPage;
                p.isNewPage = null;
            }
            if (p.dataAction == "server")
            {
                if (!p.sortOrder) p.sortOrder = "asc";
            }
            var param = [];
            if (p.parms)
            {
                var parms = $.isFunction(p.parms) ? p.parms() : p.parms;
                if (parms.length)
                {
                    $(parms).each(function ()
                    {
                        param.push({ name: this.name, value: this.value });
                    });
                    for (var i = parms.length - 1; i >= 0; i--)
                    {
                        if (parms[i].temp)
                            parms.splice(i, 1);
                    }
                }
                else if (typeof parms == "object")
                {
                    for (var name in parms)
                    {
                        param.push({ name: name, value: parms[name] });
                    }
                }
            }
            if (p.dataAction == "server")
            {
                if (p.usePager)
                {
                    param.push({ name: p.pageParmName, value: p.newPage });
                    param.push({ name: p.pagesizeParmName, value: p.pageSize });
                }
                if (p.sortName)
                {
                    param.push({ name: p.sortnameParmName, value: p.sortName });
                    param.push({ name: p.sortorderParmName, value: p.sortOrder });
                }
            };
            $(".l-bar-btnload span", g.toolbar).addClass("l-disabled");
            if (p.dataType == "local")
            {
                //原语句: g.filteredData = p.data || g.currentData;
                //该语句修改了p.data, 导致过滤数据后, 丢失了初始数据.
                g.filteredData = $.extend(true, {}, p.data || g.currentData);
                if (clause)
                    g.filteredData[p.root] = g._searchData(g.filteredData[p.root], clause);
                if (p.usePager)
                    g.currentData = g._getCurrentPageData(g.filteredData);
                else
                {
                    g.currentData = g.filteredData;
                }
                g._convertTreeData();
                g._showData();
            }
            else if (p.dataAction == "local" && !loadServer)
            {
                if (g.data && g.data[p.root])
                {
                    g.filteredData = g.data;
                    if (clause)
                        g.filteredData[p.root] = g._searchData(g.filteredData[p.root], clause);
                    g.currentData = g._getCurrentPageData(g.filteredData);
                    g._convertTreeData();
                    g._showData();
                }
            }
            else
            {
                g.loadServerData(param, clause);
                //g.loadServerData.zoeDefer(g, 10, [param, clause]);
            }
            g.loading = false;
        },
        _convertTreeData: function ()
        {
            var g = this, p = this.options;
            if (p.tree && p.tree.idField && p.tree.parentIDField)
            {
                g.currentData[p.root] = g.arrayToTree(g.currentData[p.root], p.tree.idField, p.tree.parentIDField);
                g.currentData[p.record] = g.currentData[p.root].length;
            }
        },
        loadServerData: function (param, clause)
        {
            var g = this, p = this.options;
            var url = p.url;
            if ($.isFunction(url)) url = url();
            var ajaxOptions = {
                type: p.method,
                url: url,
                data: param,
                async: p.async,
                dataType: 'json',
                beforeSend: function ()
                {
                    if (g.hasBind('loading'))
                    {
                        g.trigger('loading');
                    }
                    else
                    {
                        g.toggleLoading(true);
                    }
                },
                success: function (data)
                {   
                    if (!data || !data[p.root] || !data[p.root].length){
                        if(p.isNullMes){
                            g.gridmes.text(p.isNullMes).show();
                        }
                    }else{
                        g.gridmes.hide();                                               
                    }
                    g.trigger('success', [data, g]);
                    if (!data || !data[p.root] || !data[p.root].length)
                    {
                        g.currentData = g.data = {};
                        g.currentData[p.root] = g.data[p.root] = [];
                        if (data && data[p.record])
                        {
                            g.currentData[p.record] = g.data[p.record] = data[p.record];
                        } else
                        {
                            g.currentData[p.record] = g.data[p.record] = 0;
                        }
                        g._convertTreeData();
                        g._showData();
                        return;
                    }
                    g.data = data;
                    //保存缓存数据-记录总数
                    if (g.data[p.record] != null)
                    {
                        g.cacheData.records = g.data[p.record];
                    }
                    if (p.dataAction == "server") //服务器处理好分页排序数据
                    {
                        g.currentData = g.data;
                        //读取缓存数据-记录总数(当没有返回总记录数)
                        if (g.currentData[p.record] == null && g.cacheData.records)
                        {
                            g.currentData[p.record] = g.cacheData.records;
                        }
                    }
                    else  //在客户端处理分页排序数据
                    {
                        g.filteredData = g.data;
                        if (clause) g.filteredData[p.root] = g._searchData(g.filteredData[p.root], clause);
                        if (p.usePager)
                            g.currentData = g._getCurrentPageData(g.filteredData);
                        else
                            g.currentData = g.filteredData;
                    }
                    g._convertTreeData();
                    g._showData.zoeDefer(g, 10, [g.currentData]);
                },
                complete: function ()
                {
                    g.trigger('complete', [g]);
                    if (g.hasBind('loaded'))
                    {
                        g.trigger('loaded', [g]);
                    }
                    else
                    {
                        g.toggleLoading.zoeDefer(g, 10, [false]);
                    }
                },
                error: function (XMLHttpRequest, textStatus, errorThrown)
                {
                    g.currentData = g.data = {};
                    g.currentData[p.root] = g.data[p.root] = [];
                    g.currentData[p.record] = g.data[p.record] = 0;
                    g.toggleLoading.zoeDefer(g, 10, [false]);
                    $(".l-bar-btnload span", g.toolbar).removeClass("l-disabled");
                    g.trigger('error', [XMLHttpRequest, textStatus, errorThrown]);
                }
            };
            if (p.contentType) ajaxOptions.contentType = p.contentType;
            $.ajax(ajaxOptions);
        },
        toggleLoading: function (show)
        {
            this.gridloading[show ? 'show' : 'hide']();
        },
        _createEditor: function (editorBuilder, container, editParm, width, height)
        {
            var editor = editorBuilder.create.call(this, container, editParm);
            if (editorBuilder.setValue)
                editorBuilder.setValue.call(this, editor, editParm.value, editParm);
            if (editorBuilder.setText && editParm.column.textField)
                editorBuilder.setText.call(this, editor, editParm.text, editParm);
            if (editorBuilder.resize)
                editorBuilder.resize.call(this, editor, width, height, editParm);
            return editor;
        },
        /*
        @description 使一行进入编辑状态
        @param  {rowParm} rowindex或者rowdata
        @param {containerBulider} 编辑器填充层构造器
        */
        beginEdit: function (rowParm, containerBulider)
        {
            var g = this, p = this.options;
            if (!p.enabledEdit || p.clickToEdit) return;
            var rowdata = g.getRow(rowParm);
            if (rowdata._editing) return;
            if (g.trigger('beginEdit', { record: rowdata, rowindex: rowdata['__index'] }) == false) return;
            g.editors[rowdata['__id']] = {};
            rowdata._editing = true;
            g.reRender({ rowdata: rowdata });
            containerBulider = containerBulider || function (rowdata, column)
            {
                var cellobj = g.getCellObj(rowdata, column);
                var container = $(cellobj).html("");
                g.setCellEditing(rowdata, column, true);
                return container;
            };
            for (var i = 0, l = g.columns.length; i < l; i++)
            {
                var column = g.columns[i];
                if (!column.name || !column.editor || !column.editor.type || !p.editors[column.editor.type]) continue;
                var editor = p.editors[column.editor.type];
                var editParm = {
                    record: rowdata,
                    value: g._getValueByName(rowdata, column.name),
                    column: column,
                    rowindex: rowdata['__index'],
                    grid: g
                };
                var container = containerBulider(rowdata, column);
                var width = container.width(), height = container.height();
                var editorControl = g._createEditor(editor, container, editParm, width, height);
                g.editors[rowdata['__id']][column['__id']] = {
                    editor: editor,
                    input: editorControl,
                    editParm: editParm,
                    container: container
                };
            }
            g.trigger('afterBeginEdit', { record: rowdata, rowindex: rowdata['__index'] });

        },
        cancelEdit: function (rowParm)
        {
            var g = this;
            if (rowParm == undefined)
            {
                for (var rowid in g.editors)
                {
                    g.cancelEdit(rowid);
                }
            }
            else
            {
                var rowdata = g.getRow(rowParm);
                if (!g.editors[rowdata['__id']]) return;
                if (g.trigger('beforeCancelEdit', { record: rowdata, rowindex: rowdata['__index'] }) == false) return;
                for (var columnid in g.editors[rowdata['__id']])
                {
                    var o = g.editors[rowdata['__id']][columnid];
                    if (o.editor.destroy) o.editor.destroy(o.input, o.editParm);
                }
                delete g.editors[rowdata['__id']];
                delete rowdata['_editing'];
                g.reRender({ rowdata: rowdata });
            }
        },
        addEditRow: function (rowdata, containerBulider)
        {
            this.submitEdit();
            rowdata = this.add(rowdata);
            this.beginEdit(rowdata, containerBulider);
        },
        submitEdit: function (rowParm)
        {
            var g = this, p = this.options;
            if (rowParm == undefined)
            {
                for (var rowid in g.editors)
                {
                    g.submitEdit(rowid);
                }
            }
            else
            {
                var rowdata = g.getRow(rowParm);
                var newdata = {};
                if (!g.editors[rowdata['__id']]) return;
                for (var columnid in g.editors[rowdata['__id']])
                {
                    var o = g.editors[rowdata['__id']][columnid];
                    var column = o.editParm.column;
                    if (column.name)
                    {
                        newdata[column.name] = o.editor.getValue(o.input, o.editParm);
                    }
                    if (column.textField && o.editor.getText)
                    {
                        newdata[column.textField] = o.editor.getText(o.input, o.editParm);
                    }
                }
                if (g.trigger('beforeSubmitEdit', { record: rowdata, rowindex: rowdata['__index'], newdata: newdata }) == false)
                    return false;
                g.updateRow(rowdata, newdata);
                g.trigger('afterSubmitEdit', { record: rowdata, rowindex: rowdata['__index'], newdata: newdata });
            }
        },
        endEdit: function (rowParm)
        {
            var g = this, p = this.options;
            if (g.editor.editing)
            {
                var o = g.editor;
                g.trigger('sysEndEdit', [g.editor.editParm]);
                g.trigger('endEdit', [g.editor.editParm]);
                if (o.editor.destroy) o.editor.destroy(o.input, o.editParm);
                g.editor.container.remove();
                g.reRender({ rowdata: g.editor.editParm.record, column: g.editor.editParm.column });
                g.trigger('afterEdit', [g.editor.editParm]);
                g.editor = { editing: false };
            }
            else if (rowParm != undefined)
            {
                var rowdata = g.getRow(rowParm);
                if (!g.editors[rowdata['__id']]) return;
                if (g.submitEdit(rowParm) == false) return false;
                for (var columnid in g.editors[rowdata['__id']])
                {
                    var o = g.editors[rowdata['__id']][columnid];
                    if (o.editor.destroy) o.editor.destroy(o.input, o.editParm);
                }
                delete g.editors[rowdata['__id']];
                delete rowdata['_editing'];
                g.trigger('afterEdit', { record: rowdata, rowindex: rowdata['__index'] });
            }
            else
            {
                for (var rowid in g.editors)
                {
                    g.endEdit(rowid);
                }
            }
            g._fixHeight.zoeDefer(g, 10);
            if(p.endRowAfter)
                p.endRowAfter.zoeDefer(this, 30);
        },
        setWidth: function (w)
        {
            return this._setWidth(w);
        },
        setHeight: function (h)
        {
            return this._setHeight(h);
        },
        //是否启用复选框列
        enabledCheckbox: function ()
        {
            return this.options.checkbox ? true : false;
        },
        //是否固定列
        enabledFrozen: function ()
        {
            var g = this, p = this.options;
            if (!p.frozen) return false;
            var cols = g.columns || [];
            if (g.enabledDetail() && p.frozenDetail || g.enabledCheckbox() && p.frozenCheckbox
            || p.frozenRownumbers && p.rownumbers) return true;
            for (var i = 0, l = cols.length; i < l; i++)
            {
                if (cols[i].frozen)
                {
                    return true;
                }
            }
            this._setFrozen(false);
            return false;
        },
        //是否启用明细编辑
        enabledDetailEdit: function ()
        {
            if (!this.enabledDetail()) return false;
            return this.options.detailToEdit ? true : false;
        },
        //是否启用明细列
        enabledDetail: function ()
        {
            if (this.options.detail && this.options.detail.onShowDetail) return true;
            return false;
        },
        //是否启用分组
        enabledGroup: function ()
        {
            return this.options.groupColumnName ? true : false;
        },
        deleteSelectedRow: function ()
        {
            if (!this.selected) return;
            for (var i in this.selected)
            {
                var o = this.selected[i];
                if (o['__id'] in this.records)
                    this._deleteData.zoeDefer(this, 10, [o]);
            }
            this.reRender.zoeDefer(this, 20);
            if(p.deleteSelectedRowAfter)
                p.deleteSelectedRowAfter.zoeDefer(this, 30);
        },
        removeRange: function (rowArr)
        {
            var g = this, p = this.options;
            $.each(rowArr, function ()
            {
                g._removeData(this);
            });
            g.reRender();
        },
        remove: function (rowParm)
        {
            var g = this, p = this.options;
            var rowdata = g.getRow(rowParm);
            g._removeData(rowParm);
            g.reRender();
        },
        deleteRange: function (rowArr)
        {
            var g = this, p = this.options;
            $.each(rowArr, function ()
            {
                g._deleteData(this);
            });
            g.reRender();
        },
        deleteRow: function (rowParm)
        {
            var g = this, p = this.options;
            var rowdata = g.getRow(rowParm);
            if (!rowdata) return;
            g._deleteData(rowdata);
            g.reRender();
            g.isDataChanged = true;
        },
        _deleteData: function (rowParm)
        {
            var g = this, p = this.options;
            var rowdata = g.getRow(rowParm);
            rowdata[p.statusName] = 'delete';
            if (p.tree)
            {
                var children = g.getChildren(rowdata, true);
                if (children)
                {
                    for (var i = 0, l = children.length; i < l; i++)
                    {
                        children[i][p.statusName] = 'delete';
                    }
                }
            }
            g.deletedRows = g.deletedRows || [];
            g.deletedRows.push(rowdata);
            g._removeSelected(rowdata);
        },
        /*
        @param  {arg} column index、column name、column、单元格
        @param  {value} 值
        @param  {rowParm} rowindex或者rowdata
        */
        updateCell: function (arg, value, rowParm)
        {
            var g = this, p = this.options;
            var column, cellObj, rowdata;
            if (typeof (arg) == "string") //column name
            {
                for (var i = 0, l = g.columns.length; i < l; i++)
                {
                    if (g.columns[i].name == arg)
                    {
                        g.updateCell(i, value, rowParm);
                    }
                }
                return;
            }
            if (typeof (arg) == "number")
            {
                column = g.columns[arg];
                rowdata = g.getRow(rowParm);
                cellObj = g.getCellObj(rowdata, column);
            }
            else if (typeof (arg) == "object" && arg['__id'])
            {
                column = arg;
                rowdata = g.getRow(rowParm);
                cellObj = g.getCellObj(rowdata, column);
            }
            else
            {
                cellObj = arg;
                var ids = cellObj.id.split('|');
                var columnid = ids[ids.length - 1];
                column = g._columns[columnid];
                var row = $(cellObj).parent();
                rowdata = rowdata || g.getRow(row[0]);
            }
            if (value != null && column.name)
            {
                g._setValueByName(rowdata, column.name, value);
                if (rowdata[p.statusName] != 'add')
                    rowdata[p.statusName] = 'update';
                g.isDataChanged = true;
            }
            g.reRender({ rowdata: rowdata, column: column });
        },
        addRows: function (rowdataArr, neardata, isBefore, parentRowData)
        {
            var g = this, p = this.options;
            $(rowdataArr).each(function ()
            {
                g.addRow(this, neardata, isBefore, parentRowData);
            });
        },
        _createRowid: function ()
        {
            return "r" + (1000 + this.recordNumber);
        },
        _isRowId: function (str)
        {
            return (str in this.records);
        },
        _addNewRecord: function (o, previd, pid)
        {
            var g = this, p = this.options;
            g.recordNumber++;
            o['__id'] = g._createRowid();
            o['__previd'] = previd;
            if (previd && previd != -1)
            {
                var prev = g.records[previd];
                if (prev['__nextid'] && prev['__nextid'] != -1)
                {
                    var prevOldNext = g.records[prev['__nextid']];
                    if (prevOldNext)
                        prevOldNext['__previd'] = o['__id'];
                }
                prev['__nextid'] = o['__id'];
                o['__index'] = prev['__index'] + 1;
            }
            else
            {
                o['__index'] = 0;
            }
            if (p.tree)
            {
                if (pid && pid != -1)
                {
                    var parent = g.records[pid];
                    o['__pid'] = pid;
                    o['__level'] = parent['__level'] + 1;
                }
                else
                {
                    o['__pid'] = -1;
                    o['__level'] = 1;
                }
                o['__hasChildren'] = o[p.tree.childrenName] ? true : false;
            }
            o[p.statusName] = o[p.statusName] || "nochanged";
            g.rows[o['__index']] = o;
            g.records[o['__id']] = o;
            return o;
        },
        //将原始的数据转换成适合 grid的行数据 
        _getRows: function (data)
        {
            var g = this, p = this.options;
            var targetData = [];
            function load(data)
            {
                if (!data || !data.length) return;
                for (var i = 0, l = data.length; i < l; i++)
                {
                    var o = data[i];
                    targetData.push(o);
                    if (o[p.tree.childrenName])
                    {
                        load(o[p.tree.childrenName]);
                    }
                }
            }
            load(data);
            return targetData;
        },
        _updateGridData: function ()
        {
            var g = this, p = this.options;
            g.recordNumber = 0;
            g.rows = [];
            g.records = {};
            var previd = -1;
            function load(data, pid)
            {
                if (!data || !data.length) return;
                for (var i = 0, l = data.length; i < l; i++)
                {
                    var o = data[i];
                    g.formatRecord(o);
                    if (o[p.statusName] == "delete") continue;
                    g._addNewRecord(o, previd, pid);
                    previd = o['__id'];
                    if (o['__hasChildren'])
                    {
                        load(o[p.tree.childrenName], o['__id']);
                    }
                }
            }
            load(g.currentData[p.root], -1);
            return g.rows;
        },
        _moveData: function (from, to, isAfter)
        {
            var g = this, p = this.options;
            var fromRow = g.getRow(from);
            var toRow = g.getRow(to);
            var fromIndex, toIndex;
            var listdata = g._getParentChildren(fromRow);
            fromIndex = $.inArray(fromRow, listdata);
            listdata.splice(fromIndex, 1);
            listdata = g._getParentChildren(toRow);
            toIndex = $.inArray(toRow, listdata);
            listdata.splice(toIndex + (isAfter ? 1 : 0), 0, fromRow);
        },
        move: function (from, to, isAfter)
        {
            this._moveData(from, to, isAfter);
            this.reRender();
        },
        moveRange: function (rows, to, isAfter)
        {
            for (var i in rows)
            {
                this._moveData(rows[i], to, isAfter);
            }
            this.reRender();
        },
        up: function (rowParm)
        {
            var g = this, p = this.options;
            var rowdata = g.getRow(rowParm);
            var listdata = g._getParentChildren(rowdata);
            var index = $.inArray(rowdata, listdata);
            if (index == -1 || index == 0) return;
            var selected = g.getSelected();
            g.move(rowdata, listdata[index - 1], false);
            g.select(selected);
        },
        down: function (rowParm)
        {
            var g = this, p = this.options;
            var rowdata = g.getRow(rowParm);
            var listdata = g._getParentChildren(rowdata);
            var index = $.inArray(rowdata, listdata);
            if (index == -1 || index == listdata.length - 1) return;
            var selected = g.getSelected();
            g.move(rowdata, listdata[index + 1], true);
            g.select(selected);
        },
        addRow: function (rowdata, neardata, isBefore, parentRowData)
        {
            var g = this, p = this.options;
            rowdata = rowdata || {};
            g._addData(rowdata, parentRowData, neardata, isBefore);
            g.reRender();
            //标识状态
            rowdata[p.statusName] = 'add';
            if (p.tree)
            {
                var children = g.getChildren(rowdata, true);
                if (children)
                {
                    for (var i = 0, l = children.length; i < l; i++)
                    {
                        children[i][p.statusName] = 'add';
                    }
                }
            }
            g.isDataChanged = true;
            p.total = p.total ? (p.total + 1) : 1;
            p.pageCount = Math.ceil(p.total / p.pageSize);
            g._buildPager();
            g.trigger('SysGridHeightChanged');
            g.trigger('afterAddRow', [rowdata]);
            return rowdata;
        },
        updateRow: function (rowDom, newRowData)
        {
            var g = this, p = this.options;
            var rowdata = g.getRow(rowDom);
            //标识状态
            g.isDataChanged = true;
            $.extend(rowdata, newRowData || {});
            if (rowdata[p.statusName] != 'add')
                rowdata[p.statusName] = 'update';
            g.reRender.zoeDefer(g, 10, [{ rowdata: rowdata }]);
            if(p.updateSelectedRowAfter)
                p.updateSelectedRowAfter.zoeDefer(this, 30);
            return rowdata;
        },
        setCellEditing: function (rowdata, column, editing)
        {
            var g = this, p = this.options;
            var cell = g.getCellObj(rowdata, column);
            var methodName = editing ? 'addClass' : 'removeClass';
            $(cell)[methodName]("l-grid-row-cell-editing");
            if (rowdata['__id'] != 0)
            {
                var prevrowobj = $(g.getRowObj(rowdata['__id'])).prev();
                //当使用可编辑的grid带分组时，第一行的prev对象是分组行，不具备id等getRow方法中需要的信息
                if (!prevrowobj.length
                        || prevrowobj.length <= 0
                        || prevrowobj[0].id == null
                        || prevrowobj[0].id == "")
                {
                    return;
                }
                var prevrow = g.getRow(prevrowobj[0]);
                var cellprev = g.getCellObj(prevrow, column);
                if (!cellprev) return;
                $(cellprev)[methodName]("l-grid-row-cell-editing-topcell");
            }
            if (column['__previd'] != -1 && column['__previd'] != null)
            {
                var cellprev = $(g.getCellObj(rowdata, column)).prev();
                $(cellprev)[methodName]("l-grid-row-cell-editing-leftcell");
            }
        },
        reRender: function (e)
        {
            var g = this, p = this.options;
            e = e || {};
            var rowdata = e.rowdata, column = e.column;
            if (column && (column.isdetail || column.ischeckbox)) return;
            if (rowdata && rowdata[p.statusName] == "delete") return;
            if (rowdata && column)
            {
                var cell = g.getCellObj(rowdata, column);
                $(cell).html(g._getCellHtml(rowdata, column));
                if (!column.issystem)
                    g.setCellEditing(rowdata, column, false);
            }
            else if (rowdata)
            {
                $(g.columns).each(function () { g.reRender({ rowdata: rowdata, column: this }); });
            }
            else if (column)
            {
                for (var rowid in g.records) { g.reRender({ rowdata: g.records[rowid], column: column }); }
                for (var i = 0; i < g.totalNumber; i++)
                {
                    var tobj = document.getElementById(g.id + "|total" + i + "|" + column['__id']);  
                    $("div:first", tobj).html(g._getTotalCellContent(column, g.groups && g.groups[i] ? g.groups[i] : g.currentData[p.root]));
                }
            }
            else
            {
                g._showData();
            }
        },
        getData: function (status, removeStatus)
        {
            var g = this, p = this.options, edit = g.editor;
            var key = false;
            var name;
            var data = [];
            //判断是否在编辑
            if(edit.editing){
                if(edit.editParm.column.name){
                    g.rows[edit.editParm.rowindex][edit.editParm.column.name] = edit.input.selectedValue || edit.input.value;
                }
                if(edit.editParm.column.textField){
                    g.rows[edit.editParm.rowindex][edit.editParm.column.textField] = edit.input.selectedText;
                }
            }
            if (removeStatus == undefined) removeStatus = true;
            //判断是否有key
            for(var n in p.columns){
                if(p.columns[n].isKey){
                     key = true;
                     name = p.columns[n].columnname;
                     break;
                }
            }
            
            //遍历每行
            for (var rowid in g.records)
            {
                var o = $.extend(true, {}, g.records[rowid]);
                if (o[p.statusName] == status || status == undefined)
                {
                    if(p.isNull){                       
                        var isNallvalue = 0;
                        //遍历每列
                        for(var i in p.columns){
                             var rowName = p.columns[i].columnname;
                             //判断属性是否存在
                             if(o.hasOwnProperty(rowName)){
                                 isNallvalue = 1;
                                 break;
                             }
                        }
                        //判断key里面的值
                        if(key){
                            if(o.hasOwnProperty(name)){
                                if(o[name] == "" || o[name] == null)
                                        isNallvalue = 0;
                            }else{
                                isNallvalue = 0;
                            }                       
                        }
                        if(isNallvalue){
                            //判断列是否判空
                            for(var c in p.columns){
                                if(p.columns[c].isColumNull)
                                    if(!o.hasOwnProperty(p.columns[c].columnname) || o[p.columns[c].columnname] == "" || o[p.columns[c].columnname] == null){
                                        var rows = o.__index+1;
                                        $.zoeDialog.open({
                                            title:'消息提示',
                                            cls:'error-dialog',
                                            content:'第'+ rows +'行,'+ p.columns[c].display+'为空，请输入!',    
                                            width:360,
                                            isHidden:false,
                                            buttons: [  
                                                { text: '确&nbsp;定',cls:'l-dialog-error-y', onclick: function (item, dialog) {dialog.close(); } }
                                            ]
                                        });
                                        return false;
                                    }
                            }                           
                            data.push(g.formatRecord(o, removeStatus));
                        }
                    }else{
                        data.push(g.formatRecord(o, removeStatus)); 
                    }
                }
            }
            return data;
        },
        //格式化数据
        formatRecord: function (o, removeStatus)
        {
            delete o['__id'];
            delete o['__previd'];
            delete o['__nextid'];
            delete o['__index'];
            if (this.options.tree)
            {
                delete o['__pid'];
                delete o['__level'];
                delete o['__hasChildren'];
            }
            if (removeStatus) delete o[this.options.statusName];
            return o;
        },
        getUpdated: function ()
        {
            return this.getData('update', true);
        },
        getDeleted: function ()
        {
            return this.deletedRows;
        },
        getAdded: function ()
        {
            return this.getData('add', true);
        },
        getChanges: function ()
        {
            //getChanges函数必须保留__status属性,否则根本不知道哪些是新增的,哪些是被删除的.
            //则本函数返回的结果毫无意义.
            var g = this, p = this.options;
            var data = [];
            if (this.deletedRows)
            {
                $(this.deletedRows).each(function ()
                {
                    var o = $.extend(true, {}, this);
                    data.push(g.formatRecord(o, false));
                });
            }
            $.merge(data, g.getData("update", false));
            $.merge(data, g.getData("add", false));
            return data;
        },
        getColumn: function (columnParm)
        {
            var g = this, p = this.options;
            if (typeof columnParm == "string") // column id
            {
                if (g._isColumnId(columnParm))
                    return g._columns[columnParm];
                else
                    return g.columns[parseInt(columnParm)];
            }
            else if (typeof (columnParm) == "number") //column index
            {
                return g.columns[columnParm];
            }
            else if (typeof columnParm == "object" && columnParm.nodeType == 1) //column header cell
            {
                var ids = columnParm.id.split('|');
                var columnid = ids[ids.length - 1];
                return g._columns[columnid];
            }
            return columnParm;
        },
        getColumnType: function (columnname)
        {
            var g = this, p = this.options;
            for (i = 0; i < g.columns.length; i++)
            {
                if (g.columns[i].name == columnname)
                {
                    if (g.columns[i].type) return g.columns[i].type;
                    return "string";
                }
            }
            return null;
        },
        //是否包含汇总
        isTotalSummary: function ()
        {
            var g = this, p = this.options;
            for (var i = 0; i < g.columns.length; i++)
            {
                if (g.columns[i].totalSummary) return true;
            }
            return false;
        },
        //根据层次获取列集合
        //如果columnLevel为空，获取叶节点集合
        getColumns: function (columnLevel)
        {
            var g = this, p = this.options;
            var columns = [];
            for (var id in g._columns)
            {
                var col = g._columns[id];
                if (columnLevel != undefined)
                {
                    if (col['__level'] == columnLevel) columns.push(col);
                }
                else
                {
                    if (col['__leaf']) columns.push(col);
                }
            }
            return columns;
        },
        //改变排序
        changeSort: function (columnName, sortOrder)
        {
            var g = this, p = this.options;
            if (g.loading) return true;
            if (p.dataAction == "local")
            {
                var columnType = g.getColumnType(columnName);
                if (!g.sortedData)
                    g.sortedData = g.filteredData;
                if (!g.sortedData || !g.sortedData[p.root])
                    return;
                if (p.sortName == columnName)
                {
                    g.sortedData[p.root].reverse();
                } else
                {
                    g.sortedData[p.root].sort(function (data1, data2)
                    {
                        return g._compareData(data1, data2, columnName, columnType);
                    });
                }
                if (p.usePager)
                    g.currentData = g._getCurrentPageData(g.sortedData);
                else
                    g.currentData = g.sortedData;
                g._showData();
            }
            p.sortName = columnName;
            p.sortOrder = sortOrder;
            if (p.dataAction == "server")
            {
                g.loadData(p.where);
            }
        },
        //改变分页
        changePage: function (ctype)
        {
            var g = this, p = this.options;
            if (g.loading) return true;
            if (p.dataAction != "local" && g.isDataChanged && !confirm(p.isContinueByDataChanged))
                return false;
            p.pageCount = parseInt($(".pcontrol span", g.toolbar).html());
            switch (ctype)
            {
                case 'first': if (p.page == 1) return; p.newPage = 1; break;
                case 'prev': if (p.page == 1) return; if (p.page > 1) p.newPage = parseInt(p.page) - 1; break;
                case 'next': if (p.page >= p.pageCount) return; p.newPage = parseInt(p.page) + 1; break;
                case 'last': if (p.page >= p.pageCount) return; p.newPage = p.pageCount; break;
                case 'input':
                    var nv = parseInt($('.pcontrol input', g.toolbar).val());                    
                    if (isNaN(nv)) nv = 1;
                    if (nv < 1) nv = 1;
                    else if (nv > p.pageCount) 
                    {
                        nv = p.page; 
                        if(p.pageDialog){
                            $.zoeDialog.waitting('页码超出，请重新输入!');
                            setTimeout(function ()
                            {
                                $.zoeDialog.closeWaitting();
                            }, 1000);
                         }
                    }
                    $('.pcontrol input', g.toolbar).val(nv);
                    p.newPage = nv;
                    break;
            }
            if (p.newPage == p.page) return false;
            if (p.newPage == 1)
            {
                $(".l-bar-btnfirst span", g.toolbar).addClass("l-disabled");
                $(".l-bar-btnprev span", g.toolbar).addClass("l-disabled");
            }
            else
            {
                $(".l-bar-btnfirst span", g.toolbar).removeClass("l-disabled");
                $(".l-bar-btnprev span", g.toolbar).removeClass("l-disabled");
            }
            if (p.newPage == p.pageCount)
            {
                $(".l-bar-btnlast span", g.toolbar).addClass("l-disabled");
                $(".l-bar-btnnext span", g.toolbar).addClass("l-disabled");
            }
            else
            {
                $(".l-bar-btnlast span", g.toolbar).removeClass("l-disabled");
                $(".l-bar-btnnext span", g.toolbar).removeClass("l-disabled");
            }
            g.trigger('changePage', [p.newPage]);
            if (p.dataAction == "server")
            {   
                //修改bug: 没有判断p.parms的类型，直接默认是数组
                if(p.parms  instanceof Array){
                    p.parms.push({ name: "changepage", value: "1", temp: true });
                }else{
                    p.parms["name"]="changepage";
                    p.parms["value"]="1";
                    p.parms["temp"]="true";
                }
                g.loadData(p.where);
            }
            else
            {
                g.currentData = g._getCurrentPageData(g.filteredData);
                //增加以下一句调用: 在显示数据之前, 应该先调用转换tree的函数. 
                //否则会导致树的数据重复显示
                if (p.tree)
                {
                    var childrenName = p.tree.childrenName;
                    $(g.filteredData[p.root]).each(function (index, item)
                    {
                        if (item[childrenName])
                            item[childrenName] = [];
                    });
                    g._convertTreeData();
                }
                g._showData();
            }
        },
        getSelectedRow: function ()
        {
            for (var i in this.selected)
            {
                var o = this.selected[i];
                if (o['__id'] in this.records)
                    return o;
            }
            return null;
        },
        getSelectedRows: function ()
        {
            var arr = [];
            for (var i in this.selected)
            {
                var o = this.selected[i];
                if (o['__id'] in this.records)
                    arr.push(o);
            }
            return arr;
        },
        getSelectedRowObj: function ()
        {
            for (var i in this.selected)
            {
                var o = this.selected[i];
                if (o['__id'] in this.records)
                    return this.getRowObj(o);
            }
            return null;
        },
        getSelectedRowObjs: function ()
        {
            var arr = [];
            for (var i in this.selected)
            {
                var o = this.selected[i];
                if (o['__id'] in this.records)
                    arr.push(this.getRowObj(o));
            }
            return arr;
        },
        getCellObj: function (rowParm, column)
        {
            var rowdata = this.getRow(rowParm);
            column = this.getColumn(column);
            return document.getElementById(this._getCellDomId(rowdata, column));
        },
        getRowObj: function (rowParm, frozen)
        {
            var g = this, p = this.options;
            if (rowParm == null) return null;
            if (typeof (rowParm) == "string")
            {
                if (g._isRowId(rowParm))
                    return document.getElementById(g.id + (frozen ? "|1|" : "|2|") + rowParm);
                else
                    return document.getElementById(g.id + (frozen ? "|1|" : "|2|") + g.rows[parseInt(rowParm)]['__id']);
            }
            else if (typeof (rowParm) == "number")
            {
                return document.getElementById(g.id + (frozen ? "|1|" : "|2|") + g.rows[rowParm]['__id']);
            }
            else if (typeof (rowParm) == "object" && rowParm['__id']) //rowdata
            {
                return g.getRowObj(rowParm['__id'], frozen);
            }
            return rowParm;
        },
        getRow: function (rowParm)
        {
            var g = this, p = this.options;
            if (rowParm == null) return null;
            if (typeof (rowParm) == "string")
            {
                if (g._isRowId(rowParm))
                    return g.records[rowParm];
                else
                    return g.rows[parseInt(rowParm)];
            }
            else if (typeof (rowParm) == "number")
            {
                return g.rows[parseInt(rowParm)];
            }
            else if (typeof (rowParm) == "object" && rowParm.nodeType == 1 && !rowParm['__id']) //dom对象
            {
                return g._getRowByDomId(rowParm.id);
            }
            return rowParm;
        },
        _setColumnVisible: function (column, hide)
        {
            var g = this, p = this.options;
            if (!hide)  //显示
            {
                column._hide = false;
                document.getElementById(column['__domid']).style.display = "";
                //判断分组列是否隐藏,如果隐藏了则显示出来
                if (column['__pid'] != -1)
                {
                    var pcol = g._columns[column['__pid']];
                    if (pcol._hide)
                    {
                        document.getElementById(pcol['__domid']).style.display = "";
                        this._setColumnVisible(pcol, hide);
                    }
                }
            }
            else //隐藏
            {
                column._hide = true;
                document.getElementById(column['__domid']).style.display = "none";
                //判断同分组的列是否都隐藏,如果是则隐藏分组列
                if (column['__pid'] != -1)
                {
                    var hideall = true;
                    var pcol = this._columns[column['__pid']];
                    for (var i = 0; pcol && i < pcol.columns.length; i++)
                    {
                        if (!pcol.columns[i]._hide)
                        {
                            hideall = false;
                            break;
                        }
                    }
                    if (hideall)
                    {
                        pcol._hide = true;
                        document.getElementById(pcol['__domid']).style.display = "none";
                        this._setColumnVisible(pcol, hide);
                    }
                }
            }
        },
        //显示隐藏列
        toggleCol: function (columnparm, visible, toggleByPopup)
        {
            var g = this, p = this.options;
            var column;
            if (typeof (columnparm) == "number")
            {
                column = g.columns[columnparm];
            }
            else if (typeof (columnparm) == "object" && columnparm['__id'])
            {
                column = columnparm;
            }
            else if (typeof (columnparm) == "string")
            {
                if (g._isColumnId(columnparm)) // column id
                {
                    column = g._columns[columnparm];
                }
                else  // column name
                {
                    $(g.columns).each(function ()
                    {
                        if (this.name == columnparm)
                            g.toggleCol(this, visible, toggleByPopup);
                    });
                    return;
                }
            }
            if (!column) return;
            var columnindex = column['__leafindex'];
            var headercell = document.getElementById(column['__domid']);
            if (!headercell) return;
            headercell = $(headercell);
            var cells = [];
            for (var i in g.rows)
            {
                var obj = g.getCellObj(g.rows[i], column);
                if (obj) cells.push(obj);
            }
            for (var i = 0; i < g.totalNumber; i++)
            {
                var tobj = document.getElementById(g.id + "|total" + i + "|" + column['__id']);
                if (tobj) cells.push(tobj);
            }
            var colwidth = column._width;
            //显示列
            if (visible && column._hide)
            {
                if (column.frozen)
                    g.f.gridtablewidth += (parseInt(colwidth) + 1);
                else
                    g.gridtablewidth += (parseInt(colwidth) + 1);
                g._setColumnVisible(column, false);
                $(cells).show();
            }
                //隐藏列
            else if (!visible && !column._hide)
            {
                if (column.frozen)
                    g.f.gridtablewidth -= (parseInt(colwidth) + 1);
                else
                    g.gridtablewidth -= (parseInt(colwidth) + 1);
                g._setColumnVisible(column, true);
                $(cells).hide();
            }
            if (column.frozen)
            {
                $("div:first", g.f.gridheader).width(g.f.gridtablewidth);
                $("div:first", g.f.gridbody).width(g.f.gridtablewidth);
            }
            else
            {
                $("div:first", g.gridheader).width(g.gridtablewidth + 40);
                $("div:first", g.gridbody).width(g.gridtablewidth);
            }
            g._updateFrozenWidth();
            if (!toggleByPopup)
            {
                $(':checkbox[columnindex=' + columnindex + "]", g.popup).each(function ()
                {
                    this.checked = visible;
                    if ($.fn.zoeCheckBox)
                    {
                        var checkboxmanager = $(this).zoeGetCheckBoxManager();
                        if (checkboxmanager) checkboxmanager.updateStyle();
                    }
                });
            }
        },
        //设置列宽
        setColumnWidth: function (columnparm, newwidth)
        {
            var g = this, p = this.options;
            if (!newwidth) return;
            newwidth = parseInt(newwidth, 10);
            var column;
            if (typeof (columnparm) == "number")
            {
                column = g.columns[columnparm];
            }
            else if (typeof (columnparm) == "object" && columnparm['__id'])
            {
                column = columnparm;
            }
            else if (typeof (columnparm) == "string")
            {
                if (g._isColumnId(columnparm)) // column id
                {
                    column = g._columns[columnparm];
                }
                else  // column name
                {
                    $(g.columns).each(function ()
                    {
                        if (this.name == columnparm)
                            g.setColumnWidth(this, newwidth);
                    });
                    return;
                }
            }
            if (!column) return;
            var mincolumnwidth = p.minColumnWidth;
            if (column.minWidth) mincolumnwidth = column.minWidth;
            newwidth = newwidth < mincolumnwidth ? mincolumnwidth : newwidth;
            var diff = newwidth - column._width;
            if (g.trigger('beforeChangeColumnWidth', [column, newwidth]) == false) return;
            column._width = newwidth;
            if (column.frozen)
            {
                g.f.gridtablewidth += diff;
                $("div:first", g.f.gridheader).width(g.f.gridtablewidth);
                $("div:first", g.f.gridbody).width(g.f.gridtablewidth);
            }
            else
            {
                g.gridtablewidth += diff;
                $("div:first", g.gridheader).width(g.gridtablewidth + 40);
                $("div:first", g.gridbody).width(g.gridtablewidth);
            }
            $(document.getElementById(column['__domid'])).css('width', newwidth);
            var cells = [];
            for (var rowid in g.records)
            {
                var obj = g.getCellObj(g.records[rowid], column);
                if (obj) cells.push(obj);

                if (!g.enabledDetailEdit() && g.editors[rowid] && g.editors[rowid][column['__id']])
                {
                    var o = g.editors[rowid][column['__id']];
                    if (o.editor.resize) o.editor.resize(o.input, newwidth, o.container.height(), o.editParm);
                }
            }
            for (var i = 0; i < g.totalNumber; i++)
            {
                var tobj = document.getElementById(g.id + "|total" + i + "|" + column['__id']);
                if (tobj) cells.push(tobj);
            }
            $(cells).css('width', newwidth).find("> div.l-grid-row-cell-inner:first").css('width', newwidth - 8);

            g._updateFrozenWidth();
            g._updateHorizontalScrollStatus.zoeDefer(g, 10);

            g.trigger('afterChangeColumnWidth', [column, newwidth]);
        },
        //改变列表头内容
        changeHeaderText: function (columnparm, headerText)
        {
            var g = this, p = this.options;
            var column;
            if (typeof (columnparm) == "number")
            {
                column = g.columns[columnparm];
            }
            else if (typeof (columnparm) == "object" && columnparm['__id'])
            {
                column = columnparm;
            }
            else if (typeof (columnparm) == "string")
            {
                if (g._isColumnId(columnparm)) // column id
                {
                    column = g._columns[columnparm];
                }
                else  // column name
                {
                    $(g.columns).each(function ()
                    {
                        if (this.name == columnparm)
                            g.changeHeaderText(this, headerText);
                    });
                    return;
                }
            }
            if (!column) return;
            var columnindex = column['__leafindex'];
            var headercell = document.getElementById(column['__domid']);
            $(".l-grid-hd-cell-text", headercell).html(headerText);
            if (p.allowHideColumn)
            {
                $(':checkbox[columnindex=' + columnindex + "]", g.popup).parent().next().html(headerText);
            }
        },
        //改变列的位置
        changeCol: function (from, to, isAfter)
        {
            var g = this, p = this.options;
            if (!from || !to) return;
            var fromCol = g.getColumn(from);
            var toCol = g.getColumn(to);
            fromCol.frozen = toCol.frozen;
            var fromColIndex, toColIndex;
            var fromColumns = fromCol['__pid'] == -1 ? p.columns : g._columns[fromCol['__pid']].columns;
            var toColumns = toCol['__pid'] == -1 ? p.columns : g._columns[toCol['__pid']].columns;
            fromColIndex = $.inArray(fromCol, fromColumns);
            toColIndex = $.inArray(toCol, toColumns);
            var sameParent = fromColumns == toColumns;
            var sameLevel = fromCol['__level'] == toCol['__level'];
            toColumns.splice(toColIndex + (isAfter ? 1 : 0), 0, fromCol);
            if (!sameParent)
            {
                fromColumns.splice(fromColIndex, 1);
            }
            else
            {
                if (isAfter) fromColumns.splice(fromColIndex, 1);
                else fromColumns.splice(fromColIndex + 1, 1);
            }
            g._setColumns(p.columns);
            g.reRender();
        },


        collapseDetail: function (rowParm)
        {
            var g = this, p = this.options;
            var rowdata = g.getRow(rowParm);
            if (!rowdata) return;
            for (var i = 0, l = g.columns.length; i < l; i++)
            {
                if (g.columns[i].isdetail)
                {
                    var row = g.getRowObj(rowdata);
                    var cell = g.getCellObj(rowdata, g.columns[i]);
                    $(row).next("tr.l-grid-detailpanel").hide();
                    $(".l-grid-row-cell-detailbtn:first", cell).removeClass("l-open");
                    g.trigger('SysGridHeightChanged');
                    return;
                }
            }
        },
        extendDetail: function (rowParm)
        {
            var g = this, p = this.options;
            var rowdata = g.getRow(rowParm);
            if (!rowdata) return;
            for (var i = 0, l = g.columns.length; i < l; i++)
            {
                if (g.columns[i].isdetail)
                {
                    var row = g.getRowObj(rowdata);
                    var cell = g.getCellObj(rowdata, g.columns[i]);
                    $(row).next("tr.l-grid-detailpanel").show();
                    $(".l-grid-row-cell-detailbtn:first", cell).addClass("l-open");
                    g.trigger('SysGridHeightChanged');
                    return;
                }
            }
        },
        getParent: function (rowParm)
        {
            var g = this, p = this.options;
            if (!p.tree) return null;
            var rowdata = g.getRow(rowParm);
            if (!rowdata) return null;
            if (rowdata['__pid'] in g.records) return g.records[rowdata['__pid']];
            else return null;
        },
        getChildren: function (rowParm, deep)
        {
            var g = this, p = this.options;
            if (!p.tree) return null;
            var rowData = g.getRow(rowParm);
            if (!rowData) return null;
            var arr = [];
            function loadChildren(data)
            {
                if (data[p.tree.childrenName])
                {
                    for (var i = 0, l = data[p.tree.childrenName].length; i < l; i++)
                    {
                        var o = data[p.tree.childrenName][i];
                        if (o[p.statusName] == 'delete') continue;
                        arr.push(o);
                        if (deep)
                            loadChildren(o);
                    }
                }
            }
            loadChildren(rowData);
            return arr;
        },
        isLeaf: function (rowParm)
        {
            var g = this, p = this.options;
            var rowdata = g.getRow(rowParm);
            if (!rowdata) return;
            return rowdata['__hasChildren'] ? false : true;
        },
        hasChildren: function (rowParm)
        {
            var g = this, p = this.options;
            var rowdata = this.getRow(rowParm);
            if (!rowdata) return;
            return (rowdata[p.tree.childrenName] && rowdata[p.tree.childrenName].length) ? true : false;
        },
        existRecord: function (record)
        {
            for (var rowid in this.records)
            {
                if (this.records[rowid] == record) return true;
            }
            return false;
        },
        _removeSelected: function (rowdata)
        {
            var g = this, p = this.options;
            if (p.tree)
            {
                var children = g.getChildren(rowdata, true);
                if (children)
                {
                    for (var i = 0, l = children.length; i < l; i++)
                    {
                        var index2 = $.inArray(children[i], g.selected);
                        if (index2 != -1) g.selected.splice(index2, 1);
                    }
                }
            }
            var index = $.inArray(rowdata, g.selected);
            if (index != -1) g.selected.splice(index, 1);
        },
        _getParentChildren: function (rowParm)
        {
            var g = this, p = this.options;
            var rowdata = g.getRow(rowParm);
            var listdata;
            if (p.tree && g.existRecord(rowdata) && rowdata['__pid'] in g.records)
            {
                listdata = g.records[rowdata['__pid']][p.tree.childrenName];
            }
            else
            {
                listdata = g.currentData[p.root];
            }
            return listdata;
        },
        _removeData: function (rowdata)
        {
            var g = this, p = this.options;
            var listdata = g._getParentChildren(rowdata);
            var index = $.inArray(rowdata, listdata);
            if (index != -1)
            {
                listdata.splice(index, 1);
            }
            g._removeSelected(rowdata);
        },
        _addData: function (rowdata, parentdata, neardata, isBefore)
        {
            var g = this, p = this.options;
            if (!g.currentData) g.currentData = {};
            if (!g.currentData[p.root]) g.currentData[p.root] = [];
            var listdata = g.currentData[p.root];
            if (neardata)
            {
                if (p.tree)
                {
                    if (parentdata)
                        listdata = parentdata[p.tree.childrenName];
                    else if (neardata['__pid'] in g.records)
                        listdata = g.records[neardata['__pid']][p.tree.childrenName];
                }
                var index = $.inArray(neardata, listdata);
                listdata.splice(index == -1 ? -1 : index + (isBefore ? 0 : 1), 0, rowdata);
            }
            else
            {
                if (p.tree && parentdata)
                {
                    listdata = parentdata[p.tree.childrenName];
                }
                listdata.push(rowdata);
            }
        },
        //移动数据(树)
        //parm [parentdata] 附加到哪一个节点下级
        //parm [neardata] 附加到哪一个节点的上方/下方
        //parm [isBefore] 是否附加到上方
        _appendData: function (rowdata, parentdata, neardata, isBefore)
        {
            var g = this, p = this.options;
            rowdata[p.statusName] = "update";
            g._removeData(rowdata);
            g._addData(rowdata, parentdata, neardata, isBefore);
        },
        appendRange: function (rows, parentdata, neardata, isBefore)
        {
            var g = this, p = this.options;
            var toRender = false;
            $.each(rows, function (i, item)
            {
                if (item['__id'] && g.existRecord(item))
                {
                    if (g.isLeaf(parentdata)) g.upgrade(parentdata);
                    g._appendData(item, parentdata, neardata, isBefore);
                    toRender = true;
                }
                else
                {
                    g.appendRow(item, parentdata, neardata, isBefore);
                }
            });
            if (toRender) g.reRender();

        },
        appendRow: function (rowdata, parentdata, neardata, isBefore)
        {
            var g = this, p = this.options;
            if ($.isArray(rowdata))
            {
                g.appendRange(rowdata, parentdata, neardata, isBefore);
                return;
            }
            if (rowdata['__id'] && g.existRecord(rowdata))
            {
                g._appendData(rowdata, parentdata, neardata, isBefore);
                g.reRender();
                return;
            }
            if (parentdata && g.isLeaf(parentdata)) g.upgrade(parentdata);
            g.addRow(rowdata, neardata, isBefore ? true : false, parentdata);
        },
        upgrade: function (rowParm)
        {
            var g = this, p = this.options;
            var rowdata = g.getRow(rowParm);
            if (!rowdata || !p.tree) return;
            rowdata[p.tree.childrenName] = rowdata[p.tree.childrenName] || [];
            rowdata['__hasChildren'] = true;
            var rowobjs = [g.getRowObj(rowdata)];
            if (g.enabledFrozen()) rowobjs.push(g.getRowObj(rowdata, true));
            $("> td > div > .l-grid-tree-space:last", rowobjs).addClass("l-grid-tree-link l-grid-tree-link-open");
        },
        demotion: function (rowParm)
        {
            var g = this, p = this.options;
            var rowdata = g.getRow(rowParm);
            if (!rowdata || !p.tree) return;
            var rowobjs = [g.getRowObj(rowdata)];
            if (g.enabledFrozen()) rowobjs.push(g.getRowObj(rowdata, true));
            $("> td > div > .l-grid-tree-space:last", rowobjs).removeClass("l-grid-tree-link l-grid-tree-link-open l-grid-tree-link-close");
            if (g.hasChildren(rowdata))
            {
                var children = g.getChildren(rowdata);
                for (var i = 0, l = children.length; i < l; i++)
                {
                    g.deleteRow(children[i]);
                }
            }
            rowdata['__hasChildren'] = false;
        },

        collapseAll: function ()
        {
            var g = this, p = this.options;
            $(g.rows).each(function (rowIndex, rowParm)
            {
                var targetRowObj = g.getRowObj(rowParm);
                var linkbtn = $(".l-grid-tree-link", targetRowObj);
                if (linkbtn.hasClass("l-grid-tree-link-close")) return;
                g.toggle(rowParm);
            });
        },
        expandAll: function ()
        {
            var g = this, p = this.options;
            $(g.rows).each(function (rowIndex, rowParm)
            {
                var targetRowObj = g.getRowObj(rowParm);
                var linkbtn = $(".l-grid-tree-link", targetRowObj);
                if (linkbtn.hasClass("l-grid-tree-link-open")) return;
                g.toggle(rowParm);
            });
        },

        collapse: function (rowParm)
        {
            var g = this, p = this.options;
            var targetRowObj = g.getRowObj(rowParm);
            var linkbtn = $(".l-grid-tree-link", targetRowObj);
            if (linkbtn.hasClass("l-grid-tree-link-close")) return;
            g.toggle(rowParm);
        },
        expand: function (rowParm)
        {
            var g = this, p = this.options;
            var targetRowObj = g.getRowObj(rowParm);
            var linkbtn = $(".l-grid-tree-link", targetRowObj);
            if (linkbtn.hasClass("l-grid-tree-link-open")) return;
            g.toggle(rowParm);
        },
        toggle: function (rowParm)
        {
            if (!rowParm) return;
            var g = this, p = this.options;
            var rowdata = g.getRow(rowParm);
            var targetRowObj = [g.getRowObj(rowdata)];
            if (g.enabledFrozen()) targetRowObj.push(g.getRowObj(rowdata, true));
            var level = rowdata['__level'], indexInCollapsedRows;
            var linkbtn = $(".l-grid-tree-link:first", targetRowObj);
            var opening = true;
            g.collapsedRows = g.collapsedRows || [];
            if (linkbtn.hasClass("l-grid-tree-link-close")) //收缩
            {
                if (g.hasBind('treeExpand') && g.trigger('treeExpand', [rowdata]) == false) return false;
                linkbtn.removeClass("l-grid-tree-link-close").addClass("l-grid-tree-link-open");
                indexInCollapsedRows = $.inArray(rowdata, g.collapsedRows);
                if (indexInCollapsedRows != -1) g.collapsedRows.splice(indexInCollapsedRows, 1);
            }
            else //折叠
            {
                if (g.hasBind('treeCollapse') && g.trigger('treeCollapse', [rowdata]) == false) return false;
                opening = false;
                linkbtn.addClass("l-grid-tree-link-close").removeClass("l-grid-tree-link-open");
                indexInCollapsedRows = $.inArray(rowdata, g.collapsedRows);
                if (indexInCollapsedRows == -1) g.collapsedRows.push(rowdata);
            }
            var children = g.getChildren(rowdata, true);
            for (var i = 0, l = children.length; i < l; i++)
            {
                var o = children[i];
                var currentRow = $([g.getRowObj(o['__id'])]);
                if (g.enabledFrozen()) currentRow = currentRow.add(g.getRowObj(o['__id'], true));
                if (opening)
                {
                    $(".l-grid-tree-link", currentRow).removeClass("l-grid-tree-link-close").addClass("l-grid-tree-link-open");
                    currentRow.show();
                }
                else
                {
                    $(".l-grid-tree-link", currentRow).removeClass("l-grid-tree-link-open").addClass("l-grid-tree-link-close");
                    currentRow.hide();
                }
            }
            g.trigger(opening ? 'treeExpanded' : 'treeCollapsed', [rowdata]);
        },
        _bulid: function ()
        {
            var g = this;
            g._clearGrid();
            //创建头部
            g._initBuildHeader();
            //宽度高度初始化
            g._initHeight();
            //创建底部工具条
            g._initFootbar();
            //创建分页
            g._buildPager();
            //创建事件
            g._setEvent();
        },
        _setColumns: function (columns)
        {
            var g = this;
            //初始化列
            g._initColumns();
            //创建表头
            g._initBuildGridHeader();
            //创建 显示/隐藏 列 列表
            g._initBuildPopup();
        },
        _initBuildHeader: function ()
        {
            var g = this, p = this.options;
            if (p.title)
            {
                $(".l-panel-header-text", g.header).html(p.title);
                if (p.headerImg)
                    g.header.append("<img src='" + p.headerImg + "' />").addClass("l-panel-header-hasicon");
            }
            else
            {
                g.header.hide();
            }
            if (p.toolbar)
            {
                if ($.fn.zoeToolBar)
                {
                    g.toolbarManager = g.topbar.zoeToolBar(p.toolbar);
                    //原语句不知道为什么, toolbar的父div高度为0. 导致样式有问题. 
                    if (g.topbar.height() == 0)
                        g.topbar.parent().height(25);
                    else
                        g.topbar.parent().height(g.topbar.height());
                }
            }
            else
            {
                g.topbar.parent().remove();
            }
        },
        _createColumnId: function (column)
        {
            if (column.id != null && column.id != "") return column.id.toString();
            return "c" + (100 + this._columnCount);
        },
        _isColumnId: function (str)
        {
            return (str in this._columns);
        },
        _initColumns: function ()
        {
            var g = this, p = this.options;
            g._columns = {};             //全部列的信息  
            g._columnCount = 0;
            g._columnLeafCount = 0;
            g._columnMaxLevel = 1;
            if (!p.columns) return;
            function removeProp(column, props)
            {
                for (var i in props)
                {
                    if (props[i] in column)
                        delete column[props[i]];
                }
            }
            //设置id、pid、level、leaf，返回叶节点数,如果是叶节点，返回1
            function setColumn(column, level, pid, previd)
            {
                removeProp(column, ['__id', '__pid', '__previd', '__nextid', '__domid', '__leaf', '__leafindex', '__level', '__colSpan', '__rowSpan']);
                if (level > g._columnMaxLevel) g._columnMaxLevel = level;
                g._columnCount++;
                column['__id'] = g._createColumnId(column);
                column['__domid'] = g.id + "|hcell|" + column['__id'];
                g._columns[column['__id']] = column;
                if (!column.columns || !column.columns.length)
                    column['__leafindex'] = g._columnLeafCount++;
                column['__level'] = level;
                column['__pid'] = pid;
                column['__previd'] = previd;
                if (!column.columns || !column.columns.length)
                {
                    column['__leaf'] = true;
                    return 1;
                }
                var leafcount = 0;
                var newid = -1;
                for (var i = 0, l = column.columns.length; i < l; i++)
                {
                    var col = column.columns[i];
                    leafcount += setColumn(col, level + 1, column['__id'], newid);
                    newid = col['__id'];
                }
                column['__leafcount'] = leafcount;
                return leafcount;
            }
            var lastid = -1;
            //行序号
            if (p.rownumbers)
            {
                var frozenRownumbers = g.enabledGroup() ? false : p.frozen && p.frozenRownumbers;
                var col = { isrownumber: true, issystem: true, width: p.rownumbersColWidth, frozen: frozenRownumbers };
                setColumn(col, 1, -1, lastid);
                lastid = col['__id'];
            }
            //明细列
            if (g.enabledDetail() && p.isDetailBtn)
            {
                var frozenDetail = g.enabledGroup() ? false : p.frozen && p.frozenDetail;
                var col = { isdetail: true, issystem: true, width: p.detailColWidth, frozen: frozenDetail };
                setColumn(col, 1, -1, lastid);
                lastid = col['__id'];
            }
            //复选框列
            if (g.enabledCheckbox())
            {
                var frozenCheckbox = g.enabledGroup() ? false : p.frozen && p.frozenCheckbox;
                var col = { ischeckbox: true, issystem: true, width: p.detailColWidth, frozen: frozenCheckbox };
                setColumn(col, 1, -1, lastid);
                lastid = col['__id'];
            }
            for (var i = 0, l = p.columns.length; i < l; i++)
            {
                var col = p.columns[i];
                //增加以下一句. 因为在低版本IE中, 可能因为修改了prototype, 
                //导致这里取出undefined, 并进一步导致后续的函数调用出错. 
                if (!col) continue;
                setColumn(col, 1, -1, lastid);
                lastid = col['__id'];
            }
            //设置colSpan和rowSpan
            for (var id in g._columns)
            {
                var col = g._columns[id];
                if (col['__leafcount'] > 1)
                {
                    col['__colSpan'] = col['__leafcount'];
                }
                if (col['__leaf'] && col['__level'] != g._columnMaxLevel)
                {
                    col['__rowSpan'] = g._columnMaxLevel - col['__level'] + 1;
                }
            }
            //叶级别列的信息  
            g.columns = g.getColumns();
            $(g.columns).each(function (i, column)
            {
                column.columnname = column.name;
                column.columnindex = i;
                column.type = column.type || "string";
                column.islast = i == g.columns.length - 1;
                column.isSort = column.isSort == false ? false : true;
                column.frozen = column.frozen ? true : false;
                column._width = g._getColumnWidth(column);
                column._hide = column.hide ? true : false;
                column.enabledCustom=column.enabledCustom?true:false;
            });
        },
        _getColumnWidth: function (column)
        {  
            var g = this, p = this.options;
            var colwidth = column.width || p.columnWidth;
            if (!colwidth || colwidth == "auto")
            {
                var autoColumnNumber = 0, noAutoColumnWidth = 0;
                $(g.columns).each(function (i, col)
                {
                    var colwidth = col.width || p.columnWidth;
                    var isAuto = (!colwidth || colwidth == "auto") ? true : false;
                    if (isAuto) autoColumnNumber++;
                    else noAutoColumnWidth += (parseInt(g._getColumnWidth(col)) + 1);
                });
                colwidth = parseInt((g.grid.width() - noAutoColumnWidth) / autoColumnNumber) - 1;
            }
            if (typeof (colwidth) == "string" && colwidth.indexOf('%') > 0)
            {
                /*
                 * 修复行控件宽度被忽略的bug
                 */
                var lwidth = 0;
                if (g.enabledDetail())
                {
                    lwidth += p.detailColWidth;
                }
                if (g.enabledCheckbox())
                {
                    lwidth += p.checkboxColWidth;
                }
                if (g.options.rownumbers)
                {
                    lwidth += g.options.rownumbersColWidth;
                }
                column._width = colwidth = parseInt(parseInt(colwidth) * 0.01 * (g.grid.width() - lwidth - (g.columns.length / 2) - 1));
            }
            if (column.minWidth && colwidth < column.minWidth) colwidth = column.minWidth;
            if (column.maxWidth && colwidth > column.maxWidth) colwidth = column.maxWidth;
            return colwidth;
        },
        _createHeaderCell: function (column)
        {
            var g = this, p = this.options;
            var jcell = $("<td class='l-grid-hd-cell'><div class='l-grid-hd-cell-inner'><span class='l-grid-hd-cell-text'></span></div></td>");
            jcell.attr("id", column['__domid']);
            if (!column['__leaf'])
                jcell.addClass("l-grid-hd-cell-mul");
            if (column.columnindex == g.columns.length - 1)
            {
                jcell.addClass("l-grid-hd-cell-last");
            }
            if (column.isrownumber)
            {
                jcell.addClass("l-grid-hd-cell-rownumbers");
                jcell.html("<div class='l-grid-hd-cell-inner'></div>");
            }
            if (column.ischeckbox)
            {
                jcell.addClass("l-grid-hd-cell-checkbox");
                jcell.html("<div class='l-grid-hd-cell-inner'><div class='l-grid-hd-cell-text l-grid-hd-cell-btn-checkbox'></div></div>");
            }
            if (column.isdetail)
            {
                jcell.addClass("l-grid-hd-cell-detail");
                jcell.html("<div class='l-grid-hd-cell-inner'><div class='l-grid-hd-cell-text l-grid-hd-cell-btn-detail'></div></div>");
            }
            if (column.heightAlign)
            {
                $(".l-grid-hd-cell-inner:first", jcell).css("textAlign", column.heightAlign);
            }
            if (column['__colSpan']) jcell.attr("colSpan", column['__colSpan']);
            if (column['__rowSpan'])
            {
                jcell.attr("rowSpan", column['__rowSpan']);
                jcell.height(p.headerRowHeight * column['__rowSpan']);
                var paddingTop = (p.headerRowHeight * column['__rowSpan'] - p.headerRowHeight) / 2 - 5;
                $(".l-grid-hd-cell-inner:first", jcell).css("paddingTop", paddingTop);
            } else
            {
                jcell.height(p.headerRowHeight);
            }
            if (column['__leaf'])
            {
                jcell.width(column['_width']);
                jcell.attr("columnindex", column['__leafindex']);
            }
            var cellHeight = jcell.height();
            if (!column['__rowSpan'] && cellHeight > 10) $(">div:first", jcell).height(cellHeight);
            if (column._hide) jcell.hide();
            if (column.name) jcell.attr({ columnname: column.name });
            var headerText = "";
            if (column.display && column.display != "")
                headerText = column.display;
            else if (column.headerRender)
                headerText = column.headerRender(column);
            else
                headerText = "&nbsp;";
            $(".l-grid-hd-cell-text:first", jcell).html(headerText);
            if (!column.issystem && column['__leaf'] && column.resizable !== false && $.fn.zoeResizable && p.allowAdjustColWidth)
            {
                g.colResizable[column['__id']] = jcell.zoeResizable({
                    handles: 'e',
                    onStartResize: function (e, ev)
                    {
                        this.proxy.hide();
                        g.draggingline.css({ height: g.body.height(), top: 0, left: ev.pageX - g.grid.offset().left + parseInt(g.body[0].scrollLeft) }).show();
                    },
                    onResize: function (e, ev)
                    {
                        g.colresizing = true;
                        g.draggingline.css({ left: ev.pageX - g.grid.offset().left + parseInt(g.body[0].scrollLeft) });
                        $('body').add(jcell).css('cursor', 'e-resize');
                    },
                    onStopResize: function (e)
                    {
                        g.colresizing = false;
                        $('body').add(jcell).css('cursor', 'default');
                        g.draggingline.hide();
                        g.setColumnWidth(column, parseInt(column._width) + e.diffX);
                        return false;
                    }
                });
            }
            return jcell;
        },
        _initBuildGridHeader: function ()
        {
            var g = this, p = this.options;
            g.gridtablewidth = 0;
            g.f.gridtablewidth = 0;
            if (g.colResizable)
            {
                for (var i in g.colResizable)
                {
                    g.colResizable[i].destroy();
                }
                g.colResizable = null;
            }
            g.colResizable = {};
            $("tbody:first", g.gridheader).html("");
            $("tbody:first", g.f.gridheader).html("");
            for (var level = 1; level <= g._columnMaxLevel; level++)
            {
                var columns = g.getColumns(level);           //获取level层次的列集合
                var islast = level == g._columnMaxLevel;     //是否最末级
                var tr = $("<tr class='l-grid-hd-row'></tr>");
                var trf = $("<tr class='l-grid-hd-row'></tr>");
                if (!islast) tr.add(trf).addClass("l-grid-hd-mul");
                $("tbody:first", g.gridheader).append(tr);
                $("tbody:first", g.f.gridheader).append(trf);
                $(columns).each(function (i, column)
                {
                    (column.frozen ? trf : tr).append(g._createHeaderCell(column));
                    if (column['__leaf'])
                    {
                        var colwidth = column['_width'];
                        if (!column.frozen)
                            g.gridtablewidth += (parseInt(colwidth) ? parseInt(colwidth) : 0) + 1;
                        else
                            g.f.gridtablewidth += (parseInt(colwidth) ? parseInt(colwidth) : 0) + 1;
                    }
                });
            }
            if (g._columnMaxLevel > 0)
            {
                var h = p.headerRowHeight * g._columnMaxLevel;
                g.gridheader.add(g.f.gridheader).height(h);
                if (p.rownumbers && p.frozenRownumbers) g.f.gridheader.find("td:first").height(h);
            }
            g._updateFrozenWidth();
            $("div:first", g.gridheader).width(g.gridtablewidth + 40);
        },
        _initBuildPopup: function ()
        {
            var g = this, p = this.options;
            $(':checkbox', g.popup).unbind();
            $('tbody tr', g.popup).remove();
            $(g.columns).each(function (i, column)
            {
                if (column.issystem) return;
                if (column.isAllowHide == false) return;
                var chk = 'checked="checked"';
                if (column._hide) chk = '';
                var header = column.display;
                $('tbody', g.popup).append('<tr><td class="l-column-left"><input type="checkbox" ' + chk + ' class="l-checkbox" columnindex="' + i + '"/></td><td class="l-column-right">' + header + '</td></tr>');
            });
            if ($.fn.zoeCheckBox)
            {
                $('input:checkbox', g.popup).zoeCheckBox(
                {
                    onBeforeClick: function (obj)
                    {
                        if (!obj.checked) return true;
                        if ($('input:checked', g.popup).length <= p.minColToggle)
                            return false;
                        return true;
                    }
                });
            }
            //表头 - 显示/隐藏'列控制'按钮事件
            if (p.allowHideColumn)
            {
                $('tr', g.popup).hover(function ()
                {
                    $(this).addClass('l-popup-row-over');
                },
                function ()
                {
                    $(this).removeClass('l-popup-row-over');
                });
                var onPopupCheckboxChange = function ()
                {
                    if ($('input:checked', g.popup).length + 1 <= p.minColToggle)
                    {
                        return false;
                    }
                    g.toggleCol(parseInt($(this).attr("columnindex")), this.checked, true);
                };
                if ($.fn.zoeCheckBox)
                    $(':checkbox', g.popup).bind('change', onPopupCheckboxChange);
                else
                    $(':checkbox', g.popup).bind('click', onPopupCheckboxChange);
            }
        },
        _initHeight: function ()
        {
            var g = this, p = this.options;
            if (p.height == 'auto')
            {
                g.gridbody.height('auto');
                g.f.gridbody.height('auto');
            }
            if (p.width)
            {
                g.grid.width(p.width);
            }
            g._onResize.call(g);
        },
        _initFootbar: function ()
        {
            var g = this, p = this.options;
            if (p.usePager)
            {
                //创建底部工具条 - 选择每页显示记录数
                var optStr = "";
                var selectedIndex = -1;
                $(p.pageSizeOptions).each(function (i, item)
                {
                    var selectedStr = "";
                    if (p.pageSize == item) selectedIndex = i;
                    optStr += "<option value='" + item + "' " + selectedStr + " >" + item + "</option>";
                });

                $('.l-bar-selectpagesize', g.toolbar).append("<select name='rp' class='l-gridbar-select'>" + optStr + "</select>");
                if (selectedIndex != -1) $('.l-bar-selectpagesize select', g.toolbar)[0].selectedIndex = selectedIndex;
                if (p.switchPageSizeApplyComboBox && $.fn.zoeComboBox)
                {
                    $(".l-bar-selectpagesize select", g.toolbar).zoeComboBox(
                    {
                        onBeforeSelect: function ()
                        {
                            if (p.url && g.isDataChanged && !confirm(p.isContinueByDataChanged))
                                return false;
                            return true;
                        },
                        width: 45
                    });
                }
            }
            else
            {
                g.toolbar.hide();
            }
        },
        _searchData: function (data, clause)
        {
            var g = this, p = this.options;
            var newData = new Array();
            for (var i = 0; i < data.length; i++)
            {
                if (clause(data[i], i))
                {
                    newData[newData.length] = data[i];
                }
            }
            return newData;
        },
        _clearGrid: function ()
        {
            var g = this, p = this.options;
            for (var i in g.rows)
            {
                var rowobj = $(g.getRowObj(g.rows[i]));
                if (g.enabledFrozen())
                    rowobj = rowobj.add(g.getRowObj(g.rows[i], true));
                rowobj.unbind();
            }
            //清空数据
            g.gridbody.html("");
            g.f.gridbody.html("");
            g.recordNumber = 0;
            g.records = {};
            g.rows = [];
            //清空选择的行
            g.selected = [];
            g.totalNumber = 0;
            //编辑器计算器
            g.editorcounter = 0;
        },
        // 清理表格
        clearGrid: function () {
            var g = this, p = this.options;
            g._clearGrid();
            $.zoeui.remove(this);
            g.grid.remove();
            $('body').unbind('keydown.grid');
        },
        _fillGridBody: function (data, frozen)
        {
            var g = this, p = this.options;
            //加载数据 
            var gridhtmlarr = ['<div class="l-grid-body-inner"><table class="l-grid-body-table" cellpadding=0 cellspacing=0><tbody>'];
            if (g.enabledGroup()) //启用分组模式
            {
                var groups = []; //分组列名数组
                if(p.groupNewRowName){
                    var groupNew = []; //分组新增行数组
                }
                var groupsdata = []; //切成几块后的数据
                g.groups = groupsdata;
                for (var rowparm in data)
                {
                    var item = data[rowparm];
                    var groupColumnValue = item[p.groupColumnName];
                    if(p.groupNewRowName){
                        var groupNewColumnValue = item[p.groupNewRowName];
                    }
                    var valueIndex = $.inArray(groupColumnValue, groups);
                    if(p.groupNewRowName){
                        var valueIndexNew = $.inArray(groupNewColumnValue, groupNew);
                    }
                    if (valueIndex == -1)
                    {
                        groups.push(groupColumnValue);
                        valueIndex = groups.length - 1;
                        groupsdata.push([]);
                    }
                    if(p.groupNewRowName){
                        if(valueIndexNew==-1){
                            groupNew.push(groupNewColumnValue);
                        }
                    }
                    groupsdata[valueIndex].push(item);
                }
                $(groupsdata).each(function (i, item)
                {
                    if (groupsdata.length == 1)
                        gridhtmlarr.push('<tr class="l-grid-grouprow l-grid-grouprow-last l-grid-grouprow-first"');
                    if (i == groupsdata.length - 1)
                        gridhtmlarr.push('<tr class="l-grid-grouprow l-grid-grouprow-last"');
                    else if (i == 0)
                        gridhtmlarr.push('<tr class="l-grid-grouprow l-grid-grouprow-first"');
                    else
                        gridhtmlarr.push('<tr class="l-grid-grouprow"');
                    gridhtmlarr.push(' groupindex"=' + i + '" id="' + g.id+"|" +i+ "|" +groups[i] + '" >');
                    gridhtmlarr.push('<td colSpan="' + g.columns.length + '" class="l-grid-grouprow-cell">');
                    gridhtmlarr.push('<span class="l-grid-group-togglebtn">&nbsp;&nbsp;&nbsp;&nbsp;</span>');
                    if (p.groupRender)
                        gridhtmlarr.push(p.groupRender(groups[i], item, p.groupColumnDisplay));
                    else
                        gridhtmlarr.push(p.groupColumnDisplay + ':' + groups[i]);


                    gridhtmlarr.push('</td>');
                    gridhtmlarr.push('</tr>');

                    gridhtmlarr.push(g._getHtmlFromData(item, frozen));
                    if(p.groupNewRowName&&$.isFunction(p.groupNewRowRender)){
                        gridhtmlarr.push(p.groupNewRowRender(groupNew[i]));
                    }
                    //汇总
                    if (g.isTotalSummary())
                        gridhtmlarr.push(g._getTotalSummaryHtml(item, "l-grid-totalsummary-group", frozen));
                });
            }
            else
            {
                gridhtmlarr.push(g._getHtmlFromData(data, frozen));
            }
            gridhtmlarr.push('</tbody></table></div>');
            if (frozen) gridhtmlarr.push('<div class="l-jplace"></div>');
            (frozen ? g.f.gridbody : g.gridbody).html(gridhtmlarr.join(''));
            //分组时不需要            
            if (!g.enabledGroup())
            {
                //创建汇总行
                g._bulidTotalSummary(frozen);
            }
            $("> div:first", g.gridbody).width(g.gridtablewidth);
            //g._onResize();
        },
        _showData: function ()
        {
            var g = this, p = this.options;
            g.changedCells = {};
            var data = g.currentData[p.root];
            if (p.usePager)
            {
                //更新总记录数
                if (p.dataAction == "server" && g.data && g.data[p.record])
                    p.total = g.data[p.record];
                else if (g.filteredData && g.filteredData[p.root])
                    p.total = g.filteredData[p.root].length;
                else if (g.data && g.data[p.root])
                    p.total = g.data[p.root].length;
                else if (data)
                    p.total = data.length;

                p.page = p.newPage;
                if (!p.total) p.total = 0;
                if (!p.page) p.page = 1;
                p.pageCount = Math.ceil(p.total / p.pageSize);
                if (!p.pageCount) p.pageCount = 1;
                //更新分页
                g._buildPager();
            }
            //加载中
            $('.l-bar-btnloading:first', g.toolbar).removeClass('l-bar-btnloading');
            if (g.trigger('beforeShowData', [g.currentData]) == false) return;
            g._clearGrid();
            g.isDataChanged = false;
            if (!data || !data.length)
            {
                g.gridview.addClass("l-grid-empty");
                //空数据提示
                $("<div style='text-align:center; padding-top:20px; color:#ff0000;'>当前没有数据</div>").addClass("l-grid-body-inner").appendTo(g.gridbody).css('height',g.gridbody.height()-20);
                g.trigger('afterShowData', [g.currentData]);
                g._onResize.zoeDefer(g, 50);
                return;
            }
            else
            {
                g.gridview.removeClass("l-grid-empty");
            }
            $(".l-bar-btnload:first span", g.toolbar).removeClass("l-disabled");
            g._updateGridData();
            if (g.enabledFrozen())
                g._fillGridBody(g.rows, true);
            g._fillGridBody(g.rows, false);
            g.trigger('SysGridHeightChanged');
            if (p.totalRender)
            {
                $(".l-panel-bar-total", g.element).remove();
                $(".l-panel-bar", g.element).before('<div class="l-panel-bar-total">' + p.totalRender(g.data, g.filteredData) + '</div>');
            }
            if (p.mouseoverRowCssClass)
            {
                for (var i in g.rows)
                {
                    var rowobj = $(g.getRowObj(g.rows[i]));
                    if (g.enabledFrozen())
                        rowobj = rowobj.add(g.getRowObj(g.rows[i], true));
                    rowobj.bind('mouseover.gridrow', function ()
                    {
                        g._onRowOver(this, true);
                    }).bind('mouseout.gridrow', function ()
                    {
                        g._onRowOver(this, false);
                    });
                }
            }
            g._fixHeight();
            g.gridbody.trigger('scroll.grid');
            g.trigger('afterShowData', [g.currentData]);
        },
        _fixHeight: function ()
        {
            var g = this, p = this.options;
            if (p.fixedCellHeight || !p.frozen) return;
            var column1, column2;
            for (var i in g.columns)
            {
                var column = g.columns[i];
                if (column1 && column2) break;
                if (column.frozen && !column1)
                {
                    column1 = column;
                    continue;
                }
                if (!column.frozen && !column2)
                {
                    column2 = column;
                    continue;
                }
            }
            if (!column1 || !column2) return;
            for (var rowid in g.records)
            {
                var cell1 = g.getCellObj(rowid, column1), cell2 = g.getCellObj(rowid, column2);
                var height = Math.max($(cell1).height(), ($(cell2).height()));
                $(cell1).add(cell2).height(height);
            }
        },
        _getRowDomId: function (rowdata, frozen)
        {
            return this.id + "|" + (frozen ? "1" : "2") + "|" + rowdata['__id'];
        },
        _getCellDomId: function (rowdata, column)
        {
            return this._getRowDomId(rowdata, column.frozen) + "|" + column['__id'];
        },
        _getHtmlFromData: function (data, frozen)
        {
            if (!data) return "";
            var g = this, p = this.options;
            var gridhtmlarr = [];
            for (var i = 0, l = data.length; i < l; i++)
            {
                var item = data[i];
                var rowid = item['__id'];
                if (!item) continue;
                gridhtmlarr.push('<tr');
                gridhtmlarr.push(' id="' + g._getRowDomId(item, frozen) + '"');
                gridhtmlarr.push(' class="l-grid-row'); //class start 
                if (!frozen && g.enabledCheckbox() && p.isChecked && p.isChecked(item))
                {
                    g.select(item);
                    gridhtmlarr.push(' l-selected');
                }
                else if (g.isSelected(item))
                {
                    gridhtmlarr.push(' l-selected');
                }
                else if (p.isSelected && p.isSelected(item))
                {
                    g.select(item);
                    gridhtmlarr.push(' l-selected');
                }
               
               if(p.groupsAlterNatingRow&& ((i+1)%2==1)){
                     gridhtmlarr.push(' l-grid-row-alt');
                }
                if(!p.groupsAlterNatingRow){
                    if (item['__index'] % 2 == 1 && p.alternatingRow)
                        gridhtmlarr.push(' l-grid-row-alt');
                }
                gridhtmlarr.push('" ');  //class end
                if (p.rowAttrRender) gridhtmlarr.push(p.rowAttrRender(item, rowid));
                if (p.tree && g.collapsedRows && g.collapsedRows.length)
                {
                    var isHide = function ()
                    {
                        var pitem = g.getParent(item);
                        while (pitem)
                        {
                            if ($.inArray(pitem, g.collapsedRows) != -1) return true;
                            pitem = g.getParent(pitem);
                        }
                        return false;
                    };
                    if (isHide()) gridhtmlarr.push(' style="display:none;" ');
                }
                gridhtmlarr.push('>');
                $(g.columns).each(function (columnindex, column)
                {
                    if (frozen != column.frozen) return;
                    gridhtmlarr.push('<td');
                    gridhtmlarr.push(' id="' + g._getCellDomId(item, this) + '"');
                    //如果是行序号(系统列)
                    if (this.isrownumber)
                    {
                        gridhtmlarr.push(' class="l-grid-row-cell l-grid-row-cell-rownumbers" style="width:' + this.width + 'px"><div class="l-grid-row-cell-inner"');
                        if (p.fixedCellHeight)
                            gridhtmlarr.push(' style = "height:' + p.rowHeight + 'px;" ');
                        else
                            gridhtmlarr.push(' style = "min-height:' + p.rowHeight + 'px;" ');
                        gridhtmlarr.push('>' + (parseInt(item['__index']) + 1) + '</div></td>');
                        return;
                    }
                    //如果是复选框(系统列)
                    if (this.ischeckbox)
                    {
                        gridhtmlarr.push(' class="l-grid-row-cell l-grid-row-cell-checkbox" style="width:' + this.width + 'px"><div class="l-grid-row-cell-inner"');
                        if (p.fixedCellHeight)
                            gridhtmlarr.push(' style = "height:' + p.rowHeight + 'px;" ');
                        else
                            gridhtmlarr.push(' style = "min-height:' + p.rowHeight + 'px;" ');
                        gridhtmlarr.push('>');
                        gridhtmlarr.push('<span class="l-grid-row-cell-btn-checkbox"></span>');
                        gridhtmlarr.push('</div></td>');
                        return;
                    }
                        //如果是明细列(系统列)
                    else if (this.isdetail)
                    {
                        gridhtmlarr.push(' class="l-grid-row-cell l-grid-row-cell-detail" style="width:' + this.width + 'px"><div class="l-grid-row-cell-inner"');
                        if (p.fixedCellHeight)
                            gridhtmlarr.push(' style = "height:' + p.rowHeight + 'px;" ');
                        else
                            gridhtmlarr.push(' style = "min-height:' + p.rowHeight + 'px;" ');
                        gridhtmlarr.push('>');
                        if (!p.isShowDetailToggle || p.isShowDetailToggle(item))
                        {
                            gridhtmlarr.push('<span class="l-grid-row-cell-detailbtn"></span>');
                        }
                        gridhtmlarr.push('</div></td>');
                        return;
                    }
                    var colwidth = this._width;
                    gridhtmlarr.push(' class="l-grid-row-cell ');
                    if (g.changedCells[rowid + "_" + this['__id']]) gridhtmlarr.push("l-grid-row-cell-edited ");
                    if (this.islast)
                        gridhtmlarr.push('l-grid-row-cell-last ');
                    gridhtmlarr.push('"');
                    //if (this.columnname) gridhtmlarr.push('columnname="' + this.columnname + '"');
                    gridhtmlarr.push(' style = "');
                    gridhtmlarr.push('width:' + colwidth + 'px; ');
                    if (column._hide)
                    {
                        gridhtmlarr.push('display:none;');
                    }
                    gridhtmlarr.push(' ">');
                    gridhtmlarr.push(g._getCellHtml(item, column));
                    gridhtmlarr.push('</td>');
                });
                gridhtmlarr.push('</tr>');
            }
            return gridhtmlarr.join('');
        },
        _getCellHtml: function (rowdata, column)
        {
            var g = this, p = this.options;
            if (column.isrownumber)
                return '<div class="l-grid-row-cell-inner">' + (parseInt(rowdata['__index']) + 1) + '</div>';
            var htmlarr = [];
            htmlarr.push('<div class="l-grid-row-cell-inner"');
            //htmlarr.push('<div');
            htmlarr.push(' style = "width:' + parseInt(column._width - 8) + 'px;');
            if (p.fixedCellHeight) htmlarr.push('height:' + p.rowHeight + 'px;');
            htmlarr.push('min-height:' + p.rowHeight + 'px; ');
            if (column.align) htmlarr.push('text-align:' + column.align + ';');
            htmlarr.push('"');  
            var content = g._getCellContent(rowdata, column);  
            try{         
                if(content.indexOf("</div>") < 0 )
                {
                    if(content.indexOf("</a>") < 0 )
                        if(content.indexOf("</span>") < 0 )
                        htmlarr.push('title ="' + content + '"' );                  
                }
            } catch(error){
                htmlarr.push('title ="' + content + '"' );
            }
            htmlarr.push('>' + content + '</div>');
            return htmlarr.join('');
        },
        _setValueByName: function (data, name, value)
        {
            if (!data || !name) return null;
            if (name.indexOf('.') == -1)
            {
                data[name] = value;
            }
            else
            {
                try
                {
                    new Function("data,value", "data." + name + "=value;")(data, value);
                }
                catch (e)
                {
                }
            }
        },
        _getValueByName: function (data, name)
        {
            if (!data || !name) return null;
            if (name.indexOf('.') == -1)
            {
                return data[name];
            }
            else
            {
                try
                {
                    return new Function("data", "return data." + name + ";")(data);
                }
                catch (e)
                {
                    return null;
                }
            }
        },
        _getCellContent: function (rowdata, column)
        {
            var g = this, p = this.options;
            if (!rowdata || !column) return "";
            if (column.isrownumber) return parseInt(rowdata['__index']) + 1;
            var rowid = rowdata['__id'];
            var rowindex = rowdata['__index'];
            var value = g._getValueByName(rowdata, column.name);
            var text = g._getValueByName(rowdata, column.textField);
            var content = "";
            if (column.render)
            {
                content = column.render.call(g, rowdata, rowindex, value, column);
            }
            else if (p.formatters[column.type])
            {
                content = p.formatters[column.type].call(g, value, column);
            }
            else if (text != null)
            {
                content = text.toString();
            }
            else if (value != null)
            {
                content = value.toString();
            }
            if (p.tree && (p.tree.columnName != null && p.tree.columnName == column.name || p.tree.columnId != null && p.tree.columnId == column.id))
            {
                content = g._getTreeCellHtml(content, rowdata);
            }
            if(column.editor){
                if(column.editor.type == "number"){
                     if(content != null && content != "" && column.editor.toFixed != null){
                         content = Number(content).toFixed(column.editor.toFixed);
                         rowdata[column.name] = content;
                     } 
                }
                var boolRest = 0;
                if(column.editor.type == "combobox" || column.editor.type == "select"){
                    if(content != null && content != "" && column.editor.data){
                        for(var i in column.editor.data){
                            //匹配结果
                            if(column.editor.data[i][column.editor.textField] && content == column.editor.data[i][column.editor.textField]){
                                boolRest = 1; 
                            }
                        }
                        //是否清空
                        if(!boolRest && column.editor.isContrast){                           
                            rowdata[column.name] = "";
                            rowdata[column.textField] = "";
                            content = "";
                        }
                    }
                }
            }
            return content || "";
        },
        _getTreeCellHtml: function (oldContent, rowdata)
        {
            var level = rowdata['__level'];
            var g = this, p = this.options;
            //var isExtend = p.tree.isExtend(rowdata);
            var isExtend = $.inArray(rowdata, g.collapsedRows || []) == -1;
            var isParent = p.tree.isParent(rowdata);
            var content = "";
            level = parseInt(level) || 1;
            for (var i = 1; i < level; i++)
            {
                content += "<div class='l-grid-tree-space'></div>";
            }
            if (isExtend && isParent)
                content += "<div class='l-grid-tree-space l-grid-tree-link l-grid-tree-link-open'></div>";
            else if (isParent)
                content += "<div class='l-grid-tree-space l-grid-tree-link l-grid-tree-link-close'></div>";
            else
                content += "<div class='l-grid-tree-space'></div>";
            content += "<span class='l-grid-tree-content'>" + oldContent + "</span>";
            return content;
        },
        _applyEditor: function (obj)
        {
            var g = this, p = this.options;
            var rowcell = obj, ids = rowcell.id.split('|');
            var columnid = ids[ids.length - 1], column = g._columns[columnid];
            var row = $(rowcell).parent(), rowdata = g.getRow(row[0]), rowid = rowdata['__id'], rowindex = rowdata['__index'];
            if (!column || !column.editor) return;
            var columnname = column.name, columnindex = column.columnindex;
            if (column.editor.type && p.editors[column.editor.type])
            {
                var currentdata = g._getValueByName(rowdata, columnname);
                var editParm = { record: rowdata, value: currentdata, column: column, rowindex: rowindex };
                if (column.textField) editParm.text = g._getValueByName(rowdata, column.textField);
                if (g.trigger('beforeEdit', [editParm]) == false) return false;
                g.lastEditRow = rowdata;
                var editor = p.editors[column.editor.type],
                    jcell = $(rowcell), offset = $(rowcell).offset(),
                    width = $(rowcell).width(), height = $(rowcell).height(),
                    container = $("<div class='l-grid-editor'></div>").appendTo(g.grid),
                    left = 0,
                    top = 0,
                    pc = jcell.position(),
                    pb = g.gridbody.position(),
                    pv = g.gridview2.position(),
                    //加上括号解决不能正常判定topBar的高度。不加括号会忽略后面运算出来的值
                    topbarHeight = (p.toolbar ? g.topbar.parent().outerHeight() : 0) + (p.title ? g.header.outerHeight() : 0),
                    left = pc.left + pb.left + pv.left,
                    top = pc.top + pb.top + pv.top + topbarHeight;

                jcell.html("");
                g.setCellEditing(rowdata, column, true);
                container
                    .css({ left: left, top: ($.browser.safari ? top : top - 1) + p.editorTopDiff })
                    .show();
                if (column.textField) editParm.text = g._getValueByName(rowdata, column.textField);
                var editorInput = g._createEditor(editor, container, editParm, width, height - 1);
                g.editor = { editing: true, editor: editor, input: editorInput, editParm: editParm, container: container };
                g.unbind('sysEndEdit');
                g.bind('sysEndEdit', function ()
                {
                    var newValue = editor.getValue(editorInput, editParm);
                    if(newValue==""&&column.enabledCustom){
                        var str = "input[zoeuiid='" + editorInput.id + "']";
                        newValue=$(str).val();
                        editParm.record[editParm.column.editor.textField] = newValue;
                    }
                    if (column.textField && editor.getText)
                    {
                        editParm.text = editor.getText(editorInput, editParm);
                    }
                    if (editor.getSelected)
                    {
                        editParm.selected = editor.getSelected(editorInput, editParm);
                    }
                    if (newValue != currentdata)
                    {
                        $(rowcell).addClass("l-grid-row-cell-edited");
                        g.changedCells[rowid + "_" + column['__id']] = true;
                        if (column.textField != column.name) //如果textField跟name一样，那么获取text就可以
                        {
                            editParm.value = newValue;
                        }
                    }
                    if (column.editor.onChange) column.editor.onChange(editParm);
                    if (g._checkEditAndUpdateCell(editParm))
                    {
                        if (column.editor.onChanged) column.editor.onChanged(editParm);
                    }
                });
            }
        },
        _checkEditAndUpdateCell: function (editParm)
        {
            var g = this, p = this.options;
            if (g.trigger('beforeSubmitEdit', [editParm]) == false) return false;
            var column = editParm.column;
            if (editParm.text && column.textField) g._setValueByName(editParm.record, column.textField, editParm.text);
            g.updateCell(column, editParm.value, editParm.record);
            if (column.render || g.enabledTotal()) g.reRender({ column: column });
            g.reRender({ rowdata: editParm.record });
            return true;
        },
        _getCurrentPageData: function (source)
        {
            var g = this, p = this.options;
            var data = {};
            data[p.root] = [];
            if (!source || !source[p.root] || !source[p.root].length)
            {
                data[p.record] = 0;
                return data;
            }
            data[p.record] = source[p.root].length;
            if (!p.newPage) p.newPage = 1;
            for (i = (p.newPage - 1) * p.pageSize; i < source[p.root].length && i < p.newPage * p.pageSize; i++)
            {
                data[p.root].push(source[p.root][i]);
            }
            return data;
        },
        //比较某一列两个数据
        _compareData: function (data1, data2, columnName, columnType)
        {
            var g = this, p = this.options;
            var val1 = data1[columnName], val2 = data2[columnName];
            if (val1 == null && val2 != null) return 1;
            else if (val1 == null && val2 == null) return 0;
            else if (val1 != null && val2 == null) return -1;
            if (p.sorters[columnType])
                return p.sorters[columnType].call(g, val1, val2);
            else
                return val1 < val2 ? -1 : val1 > val2 ? 1 : 0;
        },
        _getTotalCellContent: function (column, data)
        {
            var g = this, p = this.options;
            var totalsummaryArr = [];
            if (column.totalSummary)
            {
                var isExist = function (type)
                {
                    for (var i = 0; i < types.length; i++)
                        if (types[i].toLowerCase() == type.toLowerCase()) return true;
                    return false;
                };
                var sum = 0, count = 0, avg = 0;
                var max = parseFloat(data[0][column.name]);
                var min = parseFloat(data[0][column.name]);
                for (var i = 0; i < data.length; i++)
                {
                    if (data[i][p.statusName] == 'delete') continue;
                    count += 1;
                    var value = data[i][column.name];
                    if (typeof (value) == "string") value = value.replace(/\$|\,/g, '');
                    value = parseFloat(value);
                    if (!value) continue;
                    sum += value;
                    if (value > max) max = value;
                    if (value < min) min = value;
                }
                avg = sum * 1.0 / data.length;
                if (column.totalSummary.render)
                {
                    var renderhtml = column.totalSummary.render({
                        sum: sum,
                        count: count,
                        avg: avg,
                        min: min,
                        max: max
                    }, column, g.data);
                    totalsummaryArr.push(renderhtml);
                }
                else if (column.totalSummary.type)
                {
                    var types = column.totalSummary.type.split(',');
                    if (isExist('sum'))
                        totalsummaryArr.push("<div>Sum=" + sum.toFixed(2) + "</div>");
                    if (isExist('count'))
                        totalsummaryArr.push("<div>Count=" + count + "</div>");
                    if (isExist('max'))
                        totalsummaryArr.push("<div>Max=" + max.toFixed(2) + "</div>");
                    if (isExist('min'))
                        totalsummaryArr.push("<div>Min=" + min.toFixed(2) + "</div>");
                    if (isExist('avg'))
                        totalsummaryArr.push("<div>Avg=" + avg.toFixed(2) + "</div>");
                }
            }
            return totalsummaryArr.join('');
        },
        _getTotalSummaryHtml: function (data, classCssName, frozen)
        {
            var g = this, p = this.options;
            var totalsummaryArr = [];
            if (classCssName)
                totalsummaryArr.push('<tr class="l-grid-totalsummary ' + classCssName + '">');
            else
                totalsummaryArr.push('<tr class="l-grid-totalsummary">');
            $(g.columns).each(function (columnindex, column)
            {
                if (this.frozen != frozen) return;
                //如果是行序号(系统列)
                if (this.isrownumber)
                {
                    totalsummaryArr.push('<td class="l-grid-totalsummary-cell l-grid-totalsummary-cell-rownumbers" style="width:' + this.width + 'px"><div>&nbsp;</div></td>');
                    return;
                }
                //如果是复选框(系统列)
                if (this.ischeckbox)
                {
                    totalsummaryArr.push('<td class="l-grid-totalsummary-cell l-grid-totalsummary-cell-checkbox" style="width:' + this.width + 'px"><div>&nbsp;</div></td>');
                    return;
                }
                    //如果是明细列(系统列)
                else if (this.isdetail)
                {
                    totalsummaryArr.push('<td class="l-grid-totalsummary-cell l-grid-totalsummary-cell-detail" style="width:' + this.width + 'px"><div>&nbsp;</div></td>');
                    return;
                }
                totalsummaryArr.push('<td class="l-grid-totalsummary-cell');
                if (this.islast)
                    totalsummaryArr.push(" l-grid-totalsummary-cell-last");
                totalsummaryArr.push('" ');
                totalsummaryArr.push('id="' + g.id + "|total" + g.totalNumber + "|" + column.__id + '" ');
                totalsummaryArr.push('width="' + this._width + '" ');
                columnname = this.columnname;
                if (columnname)
                {
                    totalsummaryArr.push('columnname="' + columnname + '" ');
                }
                totalsummaryArr.push('columnindex="' + columnindex + '" ');
                totalsummaryArr.push('><div class="l-grid-totalsummary-cell-inner"');
                if (column.align)
                    totalsummaryArr.push(' style="text-Align:' + column.align + ';"');
                totalsummaryArr.push('>');
                totalsummaryArr.push(g._getTotalCellContent(column, data));
                totalsummaryArr.push('</div></td>');
            });
            totalsummaryArr.push('</tr>');
            if (!frozen) g.totalNumber++;
            return totalsummaryArr.join('');
        },
        _bulidTotalSummary: function (frozen)
        {
            var g = this, p = this.options;
            if (!g.isTotalSummary()) return false;
            if (!g.currentData || g.currentData[p.root].length == 0) return false;
            var totalRow = $(g._getTotalSummaryHtml(g.currentData[p.root], null, frozen));
            $("tbody:first", frozen ? g.f.gridbody : g.gridbody).append(totalRow);
            if (frozen) g.totalRow1 = totalRow;
            else g.totalRow2 = totalRow;
        },
        updateTotalSummary: function ()
        {
            var g = this, p = this.options;
            if (!g.isTotalSummary()) return;
            if (!g.currentData || g.currentData[p.root].length == 0) return;
            var totalRow2 = $(g._getTotalSummaryHtml(g.currentData[p.root], null, false));
            if (g.totalRow2) g.totalRow2.html(totalRow2.html());
        },
        _buildPager: function ()
        {
            var g = this, p = this.options;
            $('.pcontrol input', g.toolbar).val(p.page);
            if (!p.pageCount) p.pageCount = 1;
            $('.pcontrol span', g.toolbar).html(p.pageCount);
            var r1 = parseInt((p.page - 1) * p.pageSize) + 1.0;
            var r2 = parseInt(r1) + parseInt(p.pageSize) - 1;
            if (!p.total) p.total = 0;
            if (p.total < r2) r2 = p.total;
            if (!p.total) r1 = r2 = 0;
            if (r1 < 0) r1 = 0;
            if (r2 < 0) r2 = 0;
            var stat = p.pageStatMessage;
            stat = stat.replace(/{from}/, r1);
            stat = stat.replace(/{to}/, r2);
            stat = stat.replace(/{total}/, p.total);
            stat = stat.replace(/{pagesize}/, p.pageSize);
            $('.l-bar-text', g.toolbar).html(stat);
            if (!p.total)
            {
                $(".l-bar-btnfirst span,.l-bar-btnprev span,.l-bar-btnnext span,.l-bar-btnlast span", g.toolbar)
                    .addClass("l-disabled");
            }
            if (p.page == 1)
            {
                $(".l-bar-btnfirst span", g.toolbar).addClass("l-disabled");
                $(".l-bar-btnprev span", g.toolbar).addClass("l-disabled");
            }
            else if (p.page > p.pageCount && p.pageCount > 0)
            {
                $(".l-bar-btnfirst span", g.toolbar).removeClass("l-disabled");
                $(".l-bar-btnprev span", g.toolbar).removeClass("l-disabled");
            }
            if (p.page == p.pageCount)
            {
                $(".l-bar-btnlast span", g.toolbar).addClass("l-disabled");
                $(".l-bar-btnnext span", g.toolbar).addClass("l-disabled");
            }
            else if (p.page < p.pageCount && p.pageCount > 0)
            {
                $(".l-bar-btnlast span", g.toolbar).removeClass("l-disabled");
                $(".l-bar-btnnext span", g.toolbar).removeClass("l-disabled");
            }
        },
        _getRowIdByDomId: function (domid)
        {
            var ids = domid.split('|');
            var rowid = ids[2];
            return rowid;
        },
        _getRowByDomId: function (domid)
        {
            return this.records[this._getRowIdByDomId(domid)];
        },
        //在外部点击的时候，判断是否在编辑状态，比如弹出的层点击的，如果自定义了编辑器，而且生成的层没有包括在grid内部，建议重载
        _isEditing: function (jobjs)
        {
            return jobjs.hasClass("l-box-dateeditor") || jobjs.hasClass("l-box-select");
        },
        _getSrcElementByEvent: function (e)
        {
            var g = this;
            var obj = (e.target || e.srcElement);
            var jobjs = $(obj).parents().add(obj);
            var fn = function (parm)
            {
                for (var i = 0, l = jobjs.length; i < l; i++)
                {
                    if (typeof parm == "string")
                    {
                        if ($(jobjs[i]).hasClass(parm)) return jobjs[i];
                    }
                    else if (typeof parm == "object")
                    {
                        if (jobjs[i] == parm) return jobjs[i];
                    }
                }
                return null;
            };
            if (fn("l-grid-editor")) return { editing: true, editor: fn("l-grid-editor") };
            if (jobjs.index(this.element) == -1)
            {
                if (g._isEditing(jobjs)) return { editing: true };
                else return { out: true };
            }
            var indetail = false;
            if (jobjs.hasClass("l-grid-detailpanel") && g.detailrows)
            {
                for (var i = 0, l = g.detailrows.length; i < l; i++)
                {
                    if (jobjs.index(g.detailrows[i]) != -1)
                    {
                        indetail = true;
                        break;
                    }
                }
            }
            var r = {
                grid: fn("l-panel"),
                indetail: indetail,
                frozen: fn(g.gridview1[0]) ? true : false,
                header: fn("l-panel-header"), //标题
                gridheader: fn("l-grid-header"), //表格头 
                gridbody: fn("l-grid-body"),
                total: fn("l-panel-bar-total"), //总汇总 
                popup: fn("l-grid-popup"),
                toolbar: fn("l-panel-bar")
            };
            if (r.gridheader)
            {
                r.hrow = fn("l-grid-hd-row");
                r.hcell = fn("l-grid-hd-cell");
                r.hcelltext = fn("l-grid-hd-cell-text");
                r.checkboxall = fn("l-grid-hd-cell-checkbox");
                if (r.hcell)
                {
                    var columnid = r.hcell.id.split('|')[2];
                    r.column = g._columns[columnid];
                }
            }
            if (r.gridbody)
            {
                r.row = fn("l-grid-row");
                r.cell = fn("l-grid-row-cell");
                r.checkbox = fn("l-grid-row-cell-btn-checkbox");
                r.groupbtn = fn("l-grid-group-togglebtn");
                r.grouprow = fn("l-grid-grouprow");
                r.detailbtn = fn("l-grid-row-cell-detailbtn");
                r.detailrow = fn("l-grid-detailpanel");
                r.totalrow = fn("l-grid-totalsummary");
                r.totalcell = fn("l-grid-totalsummary-cell");
                r.rownumberscell = $(r.cell).hasClass("l-grid-row-cell-rownumbers") ? r.cell : null;
                r.detailcell = $(r.cell).hasClass("l-grid-row-cell-detail") ? r.cell : null;
                r.checkboxcell = $(r.cell).hasClass("l-grid-row-cell-checkbox") ? r.cell : null;
                r.treelink = fn("l-grid-tree-link");
                r.editor = fn("l-grid-editor");
                if (r.row) r.data = this._getRowByDomId(r.row.id);
                if (r.cell) r.editing = $(r.cell).hasClass("l-grid-row-cell-editing");
                if (r.editor) r.editing = true;
                if (r.editing) r.out = false;
            }
            if (r.toolbar)
            {
                r.first = fn("l-bar-btnfirst");
                r.last = fn("l-bar-btnlast");
                r.next = fn("l-bar-btnnext");
                r.prev = fn("l-bar-btnprev");
                r.load = fn("l-bar-btnload");
                r.button = fn("l-bar-button");
            }

            return r;
        },
        _setEvent: function ()
        {
            var g = this, p = this.options;
            g.grid.bind("mousedown.grid", function (e)
            {
                g._onMouseDown.call(g, e);
            });
            g.grid.bind("dblclick.grid", function (e)
            {
                g._onDblClick.call(g, e);
            });
            g.grid.bind("contextmenu.grid", function (e)
            {
                return g._onContextmenu.call(g, e);
            });
            $(document).bind("mouseup.grid", function (e)
            {
                g._onMouseUp.call(g, e);
            });
            $(document).bind("click.grid", function (e)
            {
                g._onClick.call(g, e);
            });
            $(window).bind("resize.grid", function (e)
            {
                g._onResize.call(g);
            });
            $(document).bind("keydown.grid", function (e)
            {
                if (e.ctrlKey) g.ctrlKey = true;
            });
            $(document).bind("keyup.grid", function (e)
            {
                delete g.ctrlKey;
            });
            //表体 - 滚动联动事件 
            g.gridbody.bind('scroll.grid', function ()
            {
                var scrollLeft = g.gridbody.scrollLeft();
                var scrollTop = g.gridbody.scrollTop();
                if (scrollLeft != null)
                    g.gridheader[0].scrollLeft = scrollLeft;
                if (scrollTop != null)
                    g.f.gridbody[0].scrollTop = scrollTop;
                g.trigger('SysGridHeightChanged');
            });
            //工具条 - 切换每页记录数事件
            $('select', g.toolbar).change(function ()
            {
                if (g.isDataChanged && p.dataAction != "local" && !confirm(p.isContinueByDataChanged))
                    return false;
                p.newPage = 1;
                p.pageSize = this.value;
                g.loadData(p.dataAction != "local" ? p.where : false);
            });
            //工具条 - 切换当前页事件
            $('span.pcontrol :text', g.toolbar).blur(function (e)
            {
                g.changePage('input');
            });
            //工具条 - 切换当前页事件 -支持enter
            $('span.pcontrol :text', g.toolbar).keypress( function(e) {  
                var key = e.charCode || e.keyCode || 0;  
                if(key === 13) {   
                     g.changePage('input');
                     $(this).blur();
                } 
            });
            $("div.l-bar-button", g.toolbar).hover(function ()
            {
                $(this).addClass("l-bar-button-over");
            }, function ()
            {
                $(this).removeClass("l-bar-button-over");
            });
            //列拖拽支持
            if ($.fn.zoeDrag && p.colDraggable)
            {
                g.colDroptip = $("<div class='l-drag-coldroptip' style='display:none'><div class='l-drop-move-up'></div><div class='l-drop-move-down'></div></div>").appendTo('body');
                g.gridheader.add(g.f.gridheader).zoeDrag({
                    revert: true, animate: false,
                    proxyX: 0, proxyY: 0,
                    proxy: function (draggable, e)
                    {
                        var src = g._getSrcElementByEvent(e);
                        if (src.hcell && src.column)
                        {
                            var content = $(".l-grid-hd-cell-text:first", src.hcell).html();
                            var proxy = $("<div class='l-drag-proxy' style='display:none'><div class='l-drop-icon l-drop-no'></div></div>").appendTo('body');
                            proxy.append(content);
                            return proxy;
                        }
                    },
                    onRevert: function () { return false; },
                    onRendered: function ()
                    {
                        this.set('cursor', 'default');
                        g.children[this.id] = this;
                    },
                    onStartDrag: function (current, e)
                    {
                        if (e.button == 2) return false;
                        if (g.colresizing) return false;
                        this.set('cursor', 'default');
                        var src = g._getSrcElementByEvent(e);
                        if (!src.hcell || !src.column || src.column.issystem || src.hcelltext) return false;
                        if ($(src.hcell).css('cursor').indexOf('resize') != -1) return false;
                        this.draggingColumn = src.column;
                        g.coldragging = true;

                        var gridOffset = g.grid.offset();
                        this.validRange = {
                            top: gridOffset.top,
                            bottom: gridOffset.top + g.gridheader.height(),
                            left: gridOffset.left - 10,
                            right: gridOffset.left + g.grid.width() + 10
                        };
                    },
                    onDrag: function (current, e)
                    {
                        this.set('cursor', 'default');
                        var column = this.draggingColumn;
                        if (!column) return false;
                        if (g.colresizing) return false;
                        if (g.colDropIn == null)
                            g.colDropIn = -1;
                        var pageX = e.pageX;
                        var pageY = e.pageY;
                        var visit = false;
                        var gridOffset = g.grid.offset();
                        var validRange = this.validRange;
                        if (pageX < validRange.left || pageX > validRange.right
                            || pageY > validRange.bottom || pageY < validRange.top)
                        {
                            g.colDropIn = -1;
                            g.colDroptip.hide();
                            this.proxy.find(".l-drop-icon:first").removeClass("l-drop-yes").addClass("l-drop-no");
                            return;
                        }
                        for (var colid in g._columns)
                        {
                            var col = g._columns[colid];
                            if (column == col)
                            {
                                visit = true;
                                continue;
                            }
                            if (col.issystem) continue;
                            var sameLevel = col['__level'] == column['__level'];
                            var isAfter = !sameLevel ? false : visit ? true : false;
                            if (column.frozen != col.frozen) isAfter = col.frozen ? false : true;
                            if (g.colDropIn != -1 && g.colDropIn != colid) continue;
                            var cell = document.getElementById(col['__domid']);
                            var offset = $(cell).offset();
                            var range = {
                                top: offset.top,
                                bottom: offset.top + $(cell).height(),
                                left: offset.left - 10,
                                right: offset.left + 10
                            };
                            if (isAfter)
                            {
                                var cellwidth = $(cell).width();
                                range.left += cellwidth;
                                range.right += cellwidth;
                            }
                            if (pageX > range.left && pageX < range.right && pageY > range.top && pageY < range.bottom)
                            {
                                var height = p.headerRowHeight;
                                if (col['__rowSpan']) height *= col['__rowSpan'];
                                g.colDroptip.css({
                                    left: range.left + 5,
                                    top: range.top - 9,
                                    height: height + 9 * 2
                                }).show();
                                g.colDropIn = colid;
                                g.colDropDir = isAfter ? "right" : "left";
                                this.proxy.find(".l-drop-icon:first").removeClass("l-drop-no").addClass("l-drop-yes");
                                break;
                            }
                            else if (g.colDropIn != -1)
                            {
                                g.colDropIn = -1;
                                g.colDroptip.hide();
                                this.proxy.find(".l-drop-icon:first").removeClass("l-drop-yes").addClass("l-drop-no");
                            }
                        }
                    },
                    onStopDrag: function (current, e)
                    {
                        var column = this.draggingColumn;
                        g.coldragging = false;
                        if (g.colDropIn != -1)
                        {
                            g.changeCol.zoeDefer(g, 0, [column, g.colDropIn, g.colDropDir == "right"]);
                            g.colDropIn = -1;
                        }
                        g.colDroptip.hide();
                        this.set('cursor', 'default');
                    }
                });
            }
            //行拖拽支持
            if ($.fn.zoeDrag && p.rowDraggable)
            {
                g.rowDroptip = $("<div class='l-drag-rowdroptip' style='display:none'></div>").appendTo('body');
                g.gridbody.add(g.f.gridbody).zoeDrag({
                    revert: true, animate: false,
                    proxyX: 0, proxyY: 0,
                    proxy: function (draggable, e)
                    {
                        var src = g._getSrcElementByEvent(e);
                        if (src.row)
                        {
                            var content = p.draggingMessage.replace(/{count}/, draggable.draggingRows ? draggable.draggingRows.length : 1);
                            if (p.rowDraggingRender)
                            {
                                content = p.rowDraggingRender(draggable.draggingRows, draggable, g);
                            }
                            var proxy = $("<div class='l-drag-proxy' style='display:none'><div class='l-drop-icon l-drop-no'></div>" + content + "</div>").appendTo('body');
                            return proxy;
                        }
                    },
                    onRevert: function () { return false; },
                    onRendered: function ()
                    {
                        this.set('cursor', 'default');
                        g.children[this.id] = this;
                    },
                    onStartDrag: function (current, e)
                    {
                        if (e.button == 2) return false;
                        if (g.colresizing) return false;
                        if (!g.columns.length) return false;
                        this.set('cursor', 'default');
                        var src = g._getSrcElementByEvent(e);
                        if (!src.cell || !src.data || src.checkbox) return false;
                        var ids = src.cell.id.split('|');
                        var column = g._columns[ids[ids.length - 1]];
                        if (src.rownumberscell || src.detailcell || src.checkboxcell || column == g.columns[0])
                        {
                            if (g.enabledCheckbox())
                            {
                                this.draggingRows = g.getSelecteds();
                                if (!this.draggingRows || !this.draggingRows.length) return false;
                            }
                            else
                            {
                                this.draggingRows = [src.data];
                            }
                            this.draggingRow = src.data;
                            this.set('cursor', 'move');
                            g.rowdragging = true;
                            this.validRange = {
                                top: g.gridbody.offset().top,
                                bottom: g.gridbody.offset().top + g.gridbody.height(),
                                left: g.grid.offset().left - 10,
                                right: g.grid.offset().left + g.grid.width() + 10
                            };
                        }
                        else
                        {
                            return false;
                        }
                    },
                    onDrag: function (current, e)
                    {
                        var rowdata = this.draggingRow;
                        if (!rowdata) return false;
                        var rows = this.draggingRows ? this.draggingRows : [rowdata];
                        if (g.colresizing) return false;
                        if (g.rowDropIn == null) g.rowDropIn = -1;
                        var pageX = e.pageX;
                        var pageY = e.pageY;
                        var visit = false;
                        var validRange = this.validRange;
                        if (pageX < validRange.left || pageX > validRange.right
                            || pageY > validRange.bottom || pageY < validRange.top)
                        {
                            g.rowDropIn = -1;
                            g.rowDroptip.hide();
                            this.proxy.find(".l-drop-icon:first").removeClass("l-drop-yes l-drop-add").addClass("l-drop-no");
                            return;
                        }
                        for (var i in g.rows)
                        {
                            var rd = g.rows[i];
                            var rowid = rd['__id'];
                            if (rowdata == rd) visit = true;
                            if ($.inArray(rd, rows) != -1) continue;
                            var isAfter = visit ? true : false;
                            if (g.rowDropIn != -1 && g.rowDropIn != rowid) continue;
                            var rowobj = g.getRowObj(rowid);
                            var offset = $(rowobj).offset();
                            var range = {
                                top: offset.top - 4,
                                bottom: offset.top + $(rowobj).height() + 4,
                                left: g.grid.offset().left,
                                right: g.grid.offset().left + g.grid.width()
                            };
                            if (pageX > range.left && pageX < range.right && pageY > range.top && pageY < range.bottom)
                            {
                                var lineTop = offset.top;
                                if (isAfter) lineTop += $(rowobj).height();
                                g.rowDroptip.css({
                                    left: range.left,
                                    top: lineTop,
                                    width: range.right - range.left
                                }).show();
                                g.rowDropIn = rowid;
                                g.rowDropDir = isAfter ? "bottom" : "top";
                                if (p.tree && pageY > range.top + 5 && pageY < range.bottom - 5)
                                {
                                    this.proxy.find(".l-drop-icon:first").removeClass("l-drop-no l-drop-yes").addClass("l-drop-add");
                                    g.rowDroptip.hide();
                                    g.rowDropInParent = true;
                                }
                                else
                                {
                                    this.proxy.find(".l-drop-icon:first").removeClass("l-drop-no l-drop-add").addClass("l-drop-yes");
                                    g.rowDroptip.show();
                                    g.rowDropInParent = false;
                                }
                                break;
                            }
                            else if (g.rowDropIn != -1)
                            {
                                g.rowDropIn = -1;
                                g.rowDropInParent = false;
                                g.rowDroptip.hide();
                                this.proxy.find(".l-drop-icon:first").removeClass("l-drop-yes  l-drop-add").addClass("l-drop-no");
                            }
                        }
                    },
                    onStopDrag: function (current, e)
                    {
                        var rows = this.draggingRows;
                        g.rowdragging = false;
                        for (var i = 0; i < rows.length; i++)
                        {
                            var children = rows[i].children;
                            if (children)
                            {
                                rows = $.grep(rows, function (node, i)
                                {
                                    var isIn = $.inArray(node, children) == -1;
                                    return isIn;
                                });
                            }
                        }
                        if (g.rowDropIn != -1)
                        {
                            if (p.tree)
                            {
                                var neardata, prow;
                                if (g.rowDropInParent)
                                {
                                    prow = g.getRow(g.rowDropIn);
                                }
                                else
                                {
                                    neardata = g.getRow(g.rowDropIn);
                                    prow = g.getParent(neardata);
                                }
                                g.appendRange(rows, prow, neardata, g.rowDropDir != "bottom");
                                g.trigger('rowDragDrop', {
                                    rows: rows,
                                    parent: prow,
                                    near: neardata,
                                    after: g.rowDropDir == "bottom"
                                });
                            }
                            else
                            {
                                g.moveRange(rows, g.rowDropIn, g.rowDropDir == "bottom");
                                g.trigger('rowDragDrop', {
                                    rows: rows,
                                    parent: prow,
                                    near: g.getRow(g.rowDropIn),
                                    after: g.rowDropDir == "bottom"
                                });
                            }

                            g.rowDropIn = -1;
                        }
                        g.rowDroptip.hide();
                        this.set('cursor', 'default');
                    }
                });
            }
        },
        _onRowOver: function (rowParm, over)
        {
            if (l.draggable.dragging) return;
            var g = this, p = this.options;
            var rowdata = g.getRow(rowParm);
            var methodName = over ? "addClass" : "removeClass";
            if (g.enabledFrozen())
                $(g.getRowObj(rowdata, true))[methodName](p.mouseoverRowCssClass);
            $(g.getRowObj(rowdata, false))[methodName](p.mouseoverRowCssClass);
        },
        _onMouseUp: function (e)
        {
            var g = this, p = this.options;
            if (l.draggable.dragging)
            {
                var src = g._getSrcElementByEvent(e);

                //drop in header cell
                if (src.hcell && src.column)
                {
                    g.trigger('dragdrop', [{ type: 'header', column: src.column, cell: src.hcell }, e]);
                }
                else if (src.row)
                {
                    g.trigger('dragdrop', [{ type: 'row', record: src.data, row: src.row }, e]);
                }
            }
        },
        _onMouseDown: function (e)
        {
            var g = this, p = this.options;
        },
        _onContextmenu: function (e)
        {
            var g = this, p = this.options;
            var src = g._getSrcElementByEvent(e);
            if (src.row)
            {
                if (p.whenRClickToSelect)
                    g.select(src.data);
                if (g.hasBind('contextmenu'))
                {
                    return g.trigger('contextmenu', [{ data: src.data, rowindex: src.data['__index'], row: src.row }, e]);
                }
            }
            else if (src.hcell)
            {
                if (!p.allowHideColumn) return true;
                var columnindex = $(src.hcell).attr("columnindex");
                if (columnindex == undefined) return true;
                var left = (e.pageX - g.body.offset().left + parseInt(g.body[0].scrollLeft));
                if (columnindex == g.columns.length - 1) left -= 50;
                g.popup.css({ left: left, top: g.gridheader.height() + 1 });
                g.popup.toggle();
                return false;
            }
        },
        _onDblClick: function (e)
        {
            var g = this, p = this.options;
            var src = g._getSrcElementByEvent(e);
            if (src.row)
            {
                g.trigger('dblClickRow', [src.data, src.data['__id'], src.row]);
            }
        },
        _onClick: function (e)
        {
            var obj = (e.target || e.srcElement);
            var g = this, p = this.options;
            var src = g._getSrcElementByEvent(e);
            if (src.out)
            {
                if (g.editor.editing && !$.zoeui.win.masking) g.endEdit();
                if (p.allowHideColumn) g.popup.hide();
                return;
            }
            if (src.indetail || src.editing)
            {
                return;
            }
            if (g.editor.editing)
            {
                g._onRowOver(g.editor.editParm.record,false);
                g.endEdit();
            }
            if (p.allowHideColumn)
            {
                if (!src.popup)
                {
                    g.popup.hide();
                }
            }
            if (src.checkboxall) //复选框全选
            {
                var row = $(src.hrow);
                var uncheck = row.hasClass("l-checked");
                if (g.trigger('beforeCheckAllRow', [!uncheck, g.element]) == false) return false;
                if (uncheck)
                {
                    row.removeClass("l-checked");
                }
                else
                {
                    row.addClass("l-checked");
                }
                g.selected = [];
                for (var rowid in g.records)
                {
                    if (uncheck)
                        g.unselect(g.records[rowid]);
                    else
                        g.select(g.records[rowid]);
                }
                g.trigger('checkAllRow', [!uncheck, g.element]);
            }
            else if (src.hcelltext) //排序
            {
                var hcell = $(src.hcelltext).parent().parent();
                if (!p.enabledSort || !src.column) return;
                if (src.column.isSort == false) return;
                if (p.url && p.dataAction != "local" && g.isDataChanged && !confirm(p.isContinueByDataChanged)) return;
                var sort = $(".l-grid-hd-cell-sort:first", hcell);
                var columnName = src.column.name;
                if (!columnName) return;
                if (sort.length > 0)
                {
                    if (sort.hasClass("l-grid-hd-cell-sort-asc"))
                    {
                        sort.removeClass("l-grid-hd-cell-sort-asc").addClass("l-grid-hd-cell-sort-desc");
                        hcell.removeClass("l-grid-hd-cell-asc").addClass("l-grid-hd-cell-desc");
                        g.trigger('ChangeSort', [columnName, 'desc']);
                        g.changeSort(columnName, 'desc');
                    }
                    else if (sort.hasClass("l-grid-hd-cell-sort-desc"))
                    {
                        sort.removeClass("l-grid-hd-cell-sort-desc").addClass("l-grid-hd-cell-sort-asc");
                        hcell.removeClass("l-grid-hd-cell-desc").addClass("l-grid-hd-cell-asc");
                        g.trigger('ChangeSort', [columnName, 'asc']);
                        g.changeSort(columnName, 'asc');
                    }
                }
                else
                {
                    hcell.removeClass("l-grid-hd-cell-desc").addClass("l-grid-hd-cell-asc");
                    $(src.hcelltext).after("<span class='l-grid-hd-cell-sort l-grid-hd-cell-sort-asc'>&nbsp;&nbsp;</span>");
                    g.trigger('ChangeSort', [columnName, 'asc']);
                    g.changeSort(columnName, 'asc');
                }
                $(".l-grid-hd-cell-sort", g.gridheader).add($(".l-grid-hd-cell-sort", g.f.gridheader)).not($(".l-grid-hd-cell-sort:first", hcell)).remove();
            }
                //明细
            else if ((src.detailbtn && p.detail && src.cell) || (p.detailRowClick && p.detail && src.cell))
            {
                var item = src.data;
                if(!item){
                    return;
                }
                var row = $([g.getRowObj(item, false)]);
                if (g.enabledFrozen()) row = row.add(g.getRowObj(item, true));
                var rowid = item['__id'];
                if ($(src.detailbtn).hasClass("l-open") || $(row).hasClass("l-open") )
                {
                    if (p.detail.onCollapse)
                        p.detail.onCollapse(item, $(".l-grid-detailpanel-inner:first", nextrow)[0]);
                    row.next("tr.l-grid-detailpanel").hide();
                    $(src.detailbtn).removeClass("l-open");
                    if(p.detailRowClick){$(row).removeClass("l-open");}else{$(src.detailbtn).removeClass("l-open");}
                }
                else
                {
                    var nextrow = row.next("tr.l-grid-detailpanel");
                    if (nextrow.length > 0)
                    {
                        nextrow.show();
                        if (p.detail.onExtend)
                            p.detail.onExtend(item, $(".l-grid-detailpanel-inner:first", nextrow)[0]);
                        if(p.detailRowClick){
                            if(p.isDetailOneShow){                              
                                $('.l-open',g.grid).removeClass('l-open').next().hide();
                            }
                            $(row).addClass('l-open');
                        }else{ 
                        $(src.detailbtn).addClass("l-open");
                        }                       
                        g.trigger('SysGridHeightChanged');
                        return;
                    }
                    if(p.detailRowClick){
                        if(p.isDetailOneShow){
                            $('.l-open',g.grid).removeClass('l-open').next().hide();                            
                        }
                        $(row).addClass('l-open');
                    }else{ 
                    $(src.detailbtn).addClass("l-open");
                    } 
                    var frozenColNum = 0;
                    for (var i = 0; i < g.columns.length; i++)
                        if (g.columns[i].frozen) frozenColNum++;
                    var detailRow = $("<tr class='l-grid-detailpanel'><td><div class='l-grid-detailpanel-inner' style='display:none'></div></td></tr>");
                    var detailFrozenRow = $("<tr class='l-grid-detailpanel'><td><div class='l-grid-detailpanel-inner' style='display:none'></div></td></tr>");
                    //detailRow.find("div:first").width(g.gridheader.find("div:first").width() - 50);
                    detailRow.attr("id", g.id + "|detail|" + rowid);
                    g.detailrows = g.detailrows || [];
                    g.detailrows.push(detailRow[0]);
                    g.detailrows.push(detailFrozenRow[0]);
                    var detailRowInner = $("div:first", detailRow);
                    detailRowInner.parent().attr("colSpan", g.columns.length - frozenColNum);
                    row.eq(0).after(detailRow);
                    if (frozenColNum > 0)
                    {
                        detailFrozenRow.find("td:first").attr("colSpan", frozenColNum);
                        row.eq(1).after(detailFrozenRow);
                    }
                    if (p.detail.onShowDetail)
                    {
                        p.detail.onShowDetail(item, detailRowInner[0], function ()
                        {
                            g.trigger('SysGridHeightChanged');
                        });
                        $("div:first", detailFrozenRow).add(detailRowInner).show().height(p.detail.height || p.detailHeight);
                    }
                    else if (p.detail.render)
                    {
                        detailRowInner.append(p.detail.render());
                        detailRowInner.show();
                    }
                    g.trigger('SysGridHeightChanged');
                }
            }
            else if (src.groupbtn)
            {
                var grouprow = $(src.grouprow);
                var opening = true;
                if ($(src.groupbtn).hasClass("l-grid-group-togglebtn-close"))
                {
                    $(src.groupbtn).removeClass("l-grid-group-togglebtn-close");

                    if (grouprow.hasClass("l-grid-grouprow-last"))
                    {
                        $("td:first", grouprow).width('auto');
                    }
                }
                else
                {
                    opening = false;
                    $(src.groupbtn).addClass("l-grid-group-togglebtn-close");
                    if (grouprow.hasClass("l-grid-grouprow-last"))
                    {
                        $("td:first", grouprow).width(g.gridtablewidth);
                    }
                }
                var currentRow = grouprow.next(".l-grid-row,.l-grid-totalsummary-group,.l-grid-detailpanel");
                while (true)
                {
                    if (currentRow.length == 0) break;
                    if (opening)
                    {
                        currentRow.show();
                        
                        //如果是明细展开的行，并且之前的状态已经是关闭的，隐藏之
                        if (currentRow.hasClass("l-grid-detailpanel") && !currentRow.prev().find("td.l-grid-row-cell-detail:first span.l-grid-row-cell-detailbtn:first").hasClass("l-open"))
                        {
                            currentRow.hide();
                        }
                    }
                    else
                    {
                        currentRow.hide();
                        
                    }
                    currentRow = currentRow.next(".l-grid-row,.l-grid-totalsummary-group,.l-grid-detailpanel");
                }
                g.trigger(opening ? 'groupExtend' : 'groupCollapse');
                g.trigger('SysGridHeightChanged');
            }
                //树 - 伸展/收缩节点
            else if (src.treelink)
            {
                g.toggle(src.data);
            }
            else if (src.row && g.enabledCheckbox()) //复选框选择行
            {
                //复选框
                var selectRowButtonOnly = p.selectRowButtonOnly ? true : false;
                if (p.enabledEdit) selectRowButtonOnly = true;
                if (src.checkbox || !selectRowButtonOnly)
                {
                    var row = $(src.row);
                    var uncheck = row.hasClass("l-selected");
                    if (g.trigger('beforeCheckRow', [!uncheck, src.data, src.data['__id'], src.row]) == false)
                        return false;
                    var met = uncheck ? 'unselect' : 'select';
                    g[met](src.data);
                    if (p.tree && p.autoCheckChildren)
                    {
                        var children = g.getChildren(src.data, true);
                        for (var i = 0, l = children.length; i < l; i++)
                        {
                            g[met](children[i]);
                        }
                    }
                    g.trigger('checkRow', [!uncheck, src.data, src.data['__id'], src.row]);
                }
                if (!src.checkbox && src.cell && p.enabledEdit && p.clickToEdit)
                {
                    g._applyEditor(src.cell);
                }
            }
            else if (src.row && !g.enabledCheckbox())
            {
                if (src.cell && p.enabledEdit && p.clickToEdit)
                {
                    g._applyEditor(src.cell);
                }

                //选择行
                if ($(src.row).hasClass("l-selected"))
                {
                    if (!p.allowUnSelectRow)
                    {
                        $(src.row).addClass("l-selected-again");
                        return;
                    }
                    g.unselect(src.data);
                }
                else
                {
                    g.select(src.data);
                }
            }
            else if (src.toolbar)
            {
                if (src.first)
                {
                    if (g.trigger('toFirst', [g.element]) == false) return false;
                    g.changePage('first');
                }
                else if (src.prev)
                {
                    if (g.trigger('toPrev', [g.element]) == false) return false;
                    g.changePage('prev');
                }
                else if (src.next)
                {
                    if (g.trigger('toNext', [g.element]) == false) return false;
                    g.changePage('next');
                }
                else if (src.last)
                {
                    if (g.trigger('toLast', [g.element]) == false) return false;
                    g.changePage('last');
                }
                else if (src.load)
                {
                    if ($("span", src.load).hasClass("l-disabled")) return false;
                    if (g.trigger('reload', [g.element]) == false) return false;
                    if (p.url && g.isDataChanged && !confirm(p.isContinueByDataChanged))
                        return false;
                    g.loadData(p.where);
                }
            }
        },
        select: function (rowParm)
        {
            var g = this, p = this.options;
            var rowdata = g.getRow(rowParm);
            var rowid = rowdata['__id'];
            var rowobj = g.getRowObj(rowid);
            if (!p.rowSelectable || g.trigger('beforeSelectRow', [rowdata, rowid, rowobj]) == false) return; 
            var rowobj1 = g.getRowObj(rowid, true);
            if (!g.enabledCheckbox() && !g.ctrlKey) //单选
            {
                for (var i in g.selected)
                {
                    var o = g.selected[i];
                    if (o['__id'] in g.records)
                    {
                        $(g.getRowObj(o)).removeClass("l-selected l-selected-again");
                        if (g.enabledFrozen())
                            $(g.getRowObj(o, true)).removeClass("l-selected l-selected-again");
                    }
                }
                g.selected = [];
            }
            if (rowobj) $(rowobj).addClass("l-selected");
            if (rowobj1) $(rowobj1).addClass("l-selected");
            g.selected[g.selected.length] = rowdata;
            g.trigger('selectRow', [rowdata, rowid, rowobj]);
        },
        unselect: function (rowParm)
        {
            var g = this, p = this.options;
            var rowdata = g.getRow(rowParm);
            var rowid = rowdata['__id'];
            var rowobj = g.getRowObj(rowid);
            var rowobj1 = g.getRowObj(rowid, true);
            $(rowobj).removeClass("l-selected l-selected-again");
            if (g.enabledFrozen())
                $(rowobj1).removeClass("l-selected l-selected-again");
            g._removeSelected(rowdata);
            g.trigger('unSelectRow', [rowdata, rowid, rowobj]);
        },
        isSelected: function (rowParm)
        {
            var g = this, p = this.options;
            var rowdata = g.getRow(rowParm);
            for (var i in g.selected)
            {
                if (g.selected[i] == rowdata) return true;
            }
            return false;
        },
        arrayToTree: function (data, id, pid)      //将ID、ParentID这种数据格式转换为树格式
        {
            var g = this, p = this.options;
            var childrenName = "children";
            if (p.tree) childrenName = p.tree.childrenName;
            if (!data || !data.length) return [];
            var targetData = [];                    //存储数据的容器(返回) 
            var records = {};
            var itemLength = data.length;           //数据集合的个数
            for (var i = 0; i < itemLength; i++)
            {
                var o = data[i];
                var key = getKey(o[id]);
                records[key] = o;
            }
            for (var i = 0; i < itemLength; i++)
            {
                var currentData = data[i];
                var key = getKey(currentData[pid]);
                var parentData = records[key];
                if (!parentData)
                {
                    targetData.push(currentData);
                    continue;
                }
                parentData[childrenName] = parentData[childrenName] || [];
                parentData[childrenName].push(currentData);
            }
            return targetData;

            function getKey(key)
            {
                if (typeof (key) == "string") key = key.replace(/[.]/g, '').toLowerCase();
                return key;
            }
        },
        _onResize: function ()
        {
            var g = this, p = this.options;
            //重新初始化
            g._setColumns();
            if(g.rows.length != 0){
                g._fillGridBody(g.rows, false);
                if (p.mouseoverRowCssClass)
                    {
                        for (var i in g.rows)
                        {
                            var rowobj = $(g.getRowObj(g.rows[i]));
                            if (g.enabledFrozen())
                                rowobj = rowobj.add(g.getRowObj(g.rows[i], true));
                            rowobj.bind('mouseover.gridrow', function ()
                            {
                                g._onRowOver(this, true);
                            }).bind('mouseout.gridrow', function ()
                            {
                                g._onRowOver(this, false);
                            });
                        }
                    }
            }
            if (p.height && p.height != 'auto')
            {
                var windowHeight = $(window).height();
                //if(g.windowHeight != undefined && g.windowHeight == windowHeight) return;
                var h = 0;
                var parentHeight = null;
                if (typeof (p.height) == "string" && p.height.indexOf('%') > 0)
                {
                    var gridparent = g.grid.parent();
                    if (p.inWindow)
                    {
                        parentHeight = windowHeight;
                        parentHeight -= parseInt($('body').css('paddingTop'));
                        parentHeight -= parseInt($('body').css('paddingBottom'));
                    }
                    else
                    {
                        parentHeight = gridparent.height();
                    }
                    h = parentHeight * parseInt(p.height) * 0.01;
                    if (p.inWindow || gridparent[0].tagName.toLowerCase() == "body")
                        h -= (g.grid.offset().top - parseInt($('body').css('paddingTop')));
                }
                else
                {
                    h = parseInt(p.height);
                }

                h += p.heightDiff;
                g.windowHeight = windowHeight;
                g._setHeight(h);
            }
            else
            {
                g._updateHorizontalScrollStatus.zoeDefer(g, 10);
            }
            if (g.enabledFrozen())
            {
                var gridView1Width = g.gridview1.width();
                var gridViewWidth = g.gridview.width()
                g.gridview2.css({
                    width: gridViewWidth - gridView1Width
                });
            }            

            g.trigger('SysGridHeightChanged');
        },
        showFilter: function ()
        {
            var g = this, p = this.options;
            if (g.winfilter)
            {
                g.winfilter.show();
                return;
            }
            var filtercontainer = $('<div id="' + g.id + '_filtercontainer"></div>').width(380).height(120).hide();
            var filter = filtercontainer.zoeFilter({ fields: getFields() });
            filter.addRule($(filter.element.firstChild));
            return g.winfilter = $.zoeDialog.open({
                width: 420, height: 208,
                target: filtercontainer, isResize: true, top: 50,
                buttons: [
                    { text: '确定', onclick: function (item, dialog) { loadData(); dialog.hide(); } },
                    { text: '取消', onclick: function (item, dialog) { dialog.hide(); } }
                ]
            });

            //将grid的columns转换为filter的fields
            function getFields()
            {
                var fields = [];
                //如果是多表头，那么g.columns为最低级的列
                $(g.columns).each(function ()
                {
                    var o = { name: this.name, display: this.display };
                    var isNumber = this.type == "int" || this.type == "number" || this.type == "float";
                    var isDate = this.type == "date";
                    if (isNumber) o.type = "number";
                    if (isDate) o.type = "date";
                    if (this.editor)
                    {
                        o.editor = this.editor;
                    }
                    fields.push(o);
                });
                return fields;
            }

            function loadData()
            {
                var data = filter.getData();
                if (g.options.dataType == "server")
                {
                    //服务器过滤数据
                    loadServerData(data);
                }
                else
                {
                    //本地过滤数据
                    loadClientData(data);
                }
            }

            function loadServerData(data)
            {
                if (data && data.rules && data.rules.length)
                {
                    g.setParm("where", JSON.stringify(data));
                } else
                {
                    g.removeParm("where");
                }
                g.loadData();
            }
            function loadClientData(data)
            {
                g.loadData($.zoeFilter.getFilterFunction(data));
            }
        }
    });

    $.zoeui.controls.Grid.prototype.enabledTotal = $.zoeui.controls.Grid.prototype.isTotalSummary;
    $.zoeui.controls.Grid.prototype.add = $.zoeui.controls.Grid.prototype.addRow;
    $.zoeui.controls.Grid.prototype.update = $.zoeui.controls.Grid.prototype.updateRow;
    $.zoeui.controls.Grid.prototype.append = $.zoeui.controls.Grid.prototype.appendRow;
    $.zoeui.controls.Grid.prototype.getSelected = $.zoeui.controls.Grid.prototype.getSelectedRow;
    $.zoeui.controls.Grid.prototype.getSelecteds = $.zoeui.controls.Grid.prototype.getSelectedRows;
    $.zoeui.controls.Grid.prototype.getCheckedRows = $.zoeui.controls.Grid.prototype.getSelectedRows;
    $.zoeui.controls.Grid.prototype.getCheckedRowObjs = $.zoeui.controls.Grid.prototype.getSelectedRowObjs;
    $.zoeui.controls.Grid.prototype.setOptions = $.zoeui.controls.Grid.prototype.set;
    $.zoeui.controls.Grid.prototype.reload = $.zoeui.controls.Grid.prototype.loadData;
    $.zoeui.controls.Grid.prototype.refreshSize = $.zoeui.controls.Grid.prototype._onResize;


    function removeArrItem(arr, filterFn)
    {
        for (var i = arr.length - 1; i >= 0; i--)
        {
            if (filterFn(arr[i]))
            {
                arr.splice(i, 1);
            }
        }
    }
})(jQuery);

/**
* jQuery zoeUI 1.0.0
* 
* 
*  
* 
* 
*/
(function ($)
{
    $.fn.zoeLayout = function (options)
    {
        return $.zoeui.run.call(this, "zoeLayout", arguments);
    };

    $.fn.zoeGetLayoutManager = function ()
    {
        return $.zoeui.run.call(this, "zoeGetLayoutManager", arguments);
    };


    $.zoeDefaults.Layout = {
        topHeight: 50,
        bottomHeight: 50,
        leftWidth: 110,
        centerWidth: 300,
        rightWidth: 170,
        centerBottomHeight: 100,
        allowCenterBottomResize: true, 
        inWindow: true,     //是否以窗口的高度为准 height设置为百分比时可用
        heightDiff: 0,     //高度补差
        height: '100%',      //高度
        onHeightChanged: null,
        isLeftCollapse: false,      //初始化时 左边是否隐藏
        isRightCollapse: false,     //初始化时 右边是否隐藏
        allowLeftCollapse: true,      //是否允许 左边可以隐藏
        allowRightCollapse: true,     //是否允许 右边可以隐藏
        allowLeftResize: true,      //是否允许 左边可以调整大小
        allowRightResize: true,     //是否允许 右边可以调整大小
        allowTopResize: true,      //是否允许 头部可以调整大小
        allowBottomResize: true,     //是否允许 底部可以调整大小
        space: 3, //间隔 
        onEndResize: null,          //调整大小结束事件
        minLeftWidth: 80,            //调整左侧宽度时的最小允许宽度
        minRightWidth: 80           //调整右侧宽度时的最小允许宽度 
    };

    $.zoeMethos.Layout = {};

    $.zoeui.controls.Layout = function (element, options)
    { 
        $.zoeui.controls.Layout.base.constructor.call(this, element, options);
    };
    $.zoeui.controls.Layout.zoeExtend($.zoeui.core.UIComponent, {
        __getType: function ()
        {
            return 'Layout';
        },
        __idPrev: function ()
        {
            return 'Layout';
        },
        _extendMethods: function ()
        {
            return $.zoeMethos.Layout;
        },
        _init: function()
        {
            $.zoeui.controls.Layout.base._init.call(this);

            var g = this, p = this.options;
            if (p.InWindow != null && p.inWindow == null) p.inWindow = p.InWindow; //旧版本命名错误纠正
        },
        _render: function ()
        {
            var g = this, p = this.options;
            g.layout = $(this.element);
            g.layout.addClass("l-layout");
            g.width = g.layout.width();
            //top
            if ($("> div[position=top]", g.layout).length > 0)
            {
                g.top = $("> div[position=top]", g.layout).wrap('<div class="l-layout-top" style="top:0px;"></div>').parent();
                g.top.content = $("> div[position=top]", g.top);
                if (!g.top.content.hasClass("l-layout-content"))
                    g.top.content.addClass("l-layout-content");
                g.topHeight = p.topHeight;
                if (g.topHeight)
                {
                    g.top.height(g.topHeight);
                }
            }
            //bottom
            if ($("> div[position=bottom]", g.layout).length > 0)
            {
                g.bottom = $("> div[position=bottom]", g.layout).wrap('<div class="l-layout-bottom"></div>').parent();
                g.bottom.content = $("> div[position=bottom]", g.bottom);
                if (!g.bottom.content.hasClass("l-layout-content"))
                    g.bottom.content.addClass("l-layout-content");

                g.bottomHeight = p.bottomHeight;
                if (g.bottomHeight)
                {
                    g.bottom.height(g.bottomHeight);
                }
                //set title
                var bottomtitle = g.bottom.content.attr("title");
                if (bottomtitle)
                {
                    g.bottom.header = $('<div class="l-layout-header"></div>');
                    g.bottom.prepend(g.bottom.header);
                    g.bottom.header.html(bottomtitle);
                    g.bottom.content.attr("title", "");
                }
            }
            //left
            if ($("> div[position=left]", g.layout).length > 0)
            {
                g.left = $("> div[position=left]", g.layout).wrap('<div class="l-layout-left" style="left:0px;"></div>').parent();
                g.left.header = $('<div class="l-layout-header"><div class="l-layout-header-toggle"></div><div class="l-layout-header-inner"></div></div>');
                g.left.prepend(g.left.header);
                g.left.header.toggle = $(".l-layout-header-toggle", g.left.header);
                g.left.content = $("> div[position=left]", g.left);
                if (!g.left.content.hasClass("l-layout-content"))
                    g.left.content.addClass("l-layout-content");
                if (!p.allowLeftCollapse) $(".l-layout-header-toggle", g.left.header).remove();
                //set title
                var lefttitle = g.left.content.attr("title");
                if (lefttitle)
                {
                    g.left.content.attr("title", "");
                    $(".l-layout-header-inner", g.left.header).html(lefttitle);
                }
                //set title 
                if (g.left.content.attr("hidetitle"))
                {
                    g.left.content.attr("title", "");
                    g.left.header.remove();
                }
                //set width
                g.leftWidth = p.leftWidth;
                if (g.leftWidth)
                    g.left.width(g.leftWidth);
            }
            //center
            if ($("> div[position=center]", g.layout).length > 0)
            {
                g.center = $("> div[position=center]", g.layout).wrap('<div class="l-layout-center" ></div>').parent();
                g.center.content = $("> div[position=center]", g.center);
                g.center.content.addClass("l-layout-content");
                //set title
                var centertitle = g.center.content.attr("title");
                if (centertitle)
                {
                    g.center.content.attr("title", "");
                    g.center.header = $('<div class="l-layout-header"></div>');
                    g.center.prepend(g.center.header);
                    g.center.header.html(centertitle);
                }
                if (g.center.content.attr("hidetitle"))
                {
                    g.center.content.attr("title", "");
                    g.center.header.remove();
                }
                //set width
                g.centerWidth = p.centerWidth;
                if (g.centerWidth)
                    g.center.width(g.centerWidth); 

                //centerBottom
                if ($("> div[position=centerbottom]", g.layout).length > 0)
                {
                    g.centerBottom = $("> div[position=centerbottom]", g.layout).wrap('<div class="l-layout-centerbottom" ></div>').parent();
                    g.centerBottom.content = $("> div[position=centerbottom]", g.centerBottom);
                    g.centerBottom.content.addClass("l-layout-content");
                    //set title
                    var centertitle = g.centerBottom.content.attr("title");
                    if (centertitle)
                    {
                        g.centerBottom.content.attr("title", "");
                        g.centerBottom.header = $('<div class="l-layout-header"></div>');
                        g.centerBottom.prepend(g.centerBottom.header);
                        g.centerBottom.header.html(centertitle);
                    }
                    if (g.centerBottom.content.attr("hidetitle"))
                    {
                        g.centerBottom.content.attr("title", "");
                        if (g.centerBottom.header)
                        {
                            g.centerBottom.header.remove();
                        }
                    }
                    if (g.centerWidth)
                        g.centerBottom.width(g.centerWidth);
                }
            } 
            //right
            if ($("> div[position=right]", g.layout).length > 0)
            {
                g.right = $("> div[position=right]", g.layout).wrap('<div class="l-layout-right"></div>').parent();

                g.right.header = $('<div class="l-layout-header"><div class="l-layout-header-toggle"></div><div class="l-layout-header-inner"></div></div>');
                g.right.prepend(g.right.header);
                g.right.header.toggle = $(".l-layout-header-toggle", g.right.header);
                if (!p.allowRightCollapse) $(".l-layout-header-toggle", g.right.header).remove();
                g.right.content = $("> div[position=right]", g.right);
                if (!g.right.content.hasClass("l-layout-content"))
                    g.right.content.addClass("l-layout-content");

                //set title
                var righttitle = g.right.content.attr("title");
                if (righttitle)
                {
                    g.right.content.attr("title", "");
                    $(".l-layout-header-inner", g.right.header).html(righttitle);
                }
                if (g.right.content.attr("hidetitle"))
                {
                    g.right.content.attr("title", "");
                    g.right.header.remove();
                }
                //set width
                g.rightWidth = p.rightWidth;
                if (g.rightWidth)
                    g.right.width(g.rightWidth);
            }
            //lock
            g.layout.lock = $("<div class='l-layout-lock'></div>");
            g.layout.append(g.layout.lock);
            //DropHandle
            g._addDropHandle();

            //Collapse
            g.isLeftCollapse = p.isLeftCollapse;
            g.isRightCollapse = p.isRightCollapse;
            g.leftCollapse = $('<div class="l-layout-collapse-left" style="display: none; "><div class="l-layout-collapse-left-toggle"></div></div>');
            g.rightCollapse = $('<div class="l-layout-collapse-right" style="display: none; "><div class="l-layout-collapse-right-toggle"></div></div>');
            g.layout.append(g.leftCollapse).append(g.rightCollapse);
            g.leftCollapse.toggle = $("> .l-layout-collapse-left-toggle", g.leftCollapse);
            g.rightCollapse.toggle = $("> .l-layout-collapse-right-toggle", g.rightCollapse);
            g._setCollapse();
            //init
            g._bulid();
            $(window).resize(function ()
            {
                g._onResize();
            });
            g.set(p);
            g.mask.height(g.layout.height());
        },
        setLeftCollapse: function (isCollapse)
        {
            var g = this, p = this.options;
            if (!g.left) return false;
            g.isLeftCollapse = isCollapse;
            if (g.isLeftCollapse)
            {
                g.leftCollapse.show();
                g.leftDropHandle && g.leftDropHandle.hide();
                g.left.hide();
            }
            else
            {
                g.leftCollapse.hide();
                g.leftDropHandle && g.leftDropHandle.show();
                g.left.show();
            }
            g._onResize();
        },
        setRightCollapse: function (isCollapse)
        {
            var g = this, p = this.options;
            if (!g.right) return false;
            g.isRightCollapse = isCollapse;
            g._onResize();
            if (g.isRightCollapse)
            {
                g.rightCollapse.show();
                g.rightDropHandle && g.rightDropHandle.hide();
                g.right.hide();
            }
            else
            {
                g.rightCollapse.hide();
                g.rightDropHandle && g.rightDropHandle.show();
                g.right.show();
            }
            g._onResize();
        },
        _bulid: function ()
        {
            var g = this, p = this.options;
            $("> .l-layout-left .l-layout-header,> .l-layout-right .l-layout-header", g.layout).hover(function ()
            {
                $(this).addClass("l-layout-header-over");
            }, function ()
            {
                $(this).removeClass("l-layout-header-over");

            });
            $(".l-layout-header-toggle", g.layout).hover(function ()
            {
                $(this).addClass("l-layout-header-toggle-over");
            }, function ()
            {
                $(this).removeClass("l-layout-header-toggle-over");

            });
            $(".l-layout-header-toggle", g.left).click(function ()
            {
                g.setLeftCollapse(true);
            });
            $(".l-layout-header-toggle", g.right).click(function ()
            {
                g.setRightCollapse(true);
            });
            //set top
            g.middleTop = 0;
            if (g.top)
            {
                g.middleTop += g.top.height();
                g.middleTop += parseInt(g.top.css('borderTopWidth'));
                g.middleTop += parseInt(g.top.css('borderBottomWidth'));
                g.middleTop += p.space;
            }
            if (g.left)
            {
                g.left.css({ top: g.middleTop });
                g.leftCollapse.css({ top: g.middleTop });
            }
            if (g.center) g.center.css({ top: g.middleTop });
            if (g.right)
            {
                g.right.css({ top: g.middleTop });
                g.rightCollapse.css({ top: g.middleTop });
            }
            //set left
            if (g.left) g.left.css({ left: 0 });
            g._onResize();
            g._onResize();
        },
        _setCollapse: function ()
        {
            var g = this, p = this.options;
            g.leftCollapse.hover(function ()
            {
                $(this).addClass("l-layout-collapse-left-over");
            }, function ()
            {
                $(this).removeClass("l-layout-collapse-left-over");
            });
            g.leftCollapse.toggle.hover(function ()
            {
                $(this).addClass("l-layout-collapse-left-toggle-over");
            }, function ()
            {
                $(this).removeClass("l-layout-collapse-left-toggle-over");
            });
            g.rightCollapse.hover(function ()
            {
                $(this).addClass("l-layout-collapse-right-over");
            }, function ()
            {
                $(this).removeClass("l-layout-collapse-right-over");
            });
            g.rightCollapse.toggle.hover(function ()
            {
                $(this).addClass("l-layout-collapse-right-toggle-over");
            }, function ()
            {
                $(this).removeClass("l-layout-collapse-right-toggle-over");
            });
            g.leftCollapse.toggle.click(function ()
            {
                g.setLeftCollapse(false);
            });
            g.rightCollapse.toggle.click(function ()
            {
                g.setRightCollapse(false);
            });
            if (g.left && g.isLeftCollapse)
            {
                g.leftCollapse.show();
                g.leftDropHandle && g.leftDropHandle.hide();
                g.left.hide();
            }
            if (g.right && g.isRightCollapse)
            {
                g.rightCollapse.show();
                g.rightDropHandle && g.rightDropHandle.hide();
                g.right.hide();
            }
        },
        _addDropHandle: function ()
        {
            var g = this, p = this.options;
            if (g.left && p.allowLeftResize)
            {
                g.leftDropHandle = $("<div class='l-layout-drophandle-left'></div>");
                g.layout.append(g.leftDropHandle);
                g.leftDropHandle && g.leftDropHandle.show();
                g.leftDropHandle.mousedown(function (e)
                {
                    g._start('leftresize', e);
                });
            }
            if (g.right && p.allowRightResize)
            {
                g.rightDropHandle = $("<div class='l-layout-drophandle-right'></div>");
                g.layout.append(g.rightDropHandle);
                g.rightDropHandle && g.rightDropHandle.show();
                g.rightDropHandle.mousedown(function (e)
                {
                    g._start('rightresize', e);
                });
            }
            if (g.top && p.allowTopResize)
            {
                g.topDropHandle = $("<div class='l-layout-drophandle-top'></div>");
                g.layout.append(g.topDropHandle);
                g.topDropHandle.show();
                g.topDropHandle.mousedown(function (e)
                {
                    g._start('topresize', e);
                });
            }
            if (g.bottom && p.allowBottomResize)
            {
                g.bottomDropHandle = $("<div class='l-layout-drophandle-bottom'></div>");
                g.layout.append(g.bottomDropHandle);
                g.bottomDropHandle.show();
                g.bottomDropHandle.mousedown(function (e)
                {
                    g._start('bottomresize', e);
                });
            }
            if (g.centerBottom && p.allowCenterBottomResize)
            {
                g.centerBottomDropHandle = $("<div class='l-layout-drophandle-centerbottom'></div>");
                g.layout.append(g.centerBottomDropHandle);
                g.centerBottomDropHandle.show();
                g.centerBottomDropHandle.mousedown(function (e)
                {
                    g._start('centerbottomresize', e);
                });
            }
            g.draggingxline = $("<div class='l-layout-dragging-xline'></div>");
            g.draggingyline = $("<div class='l-layout-dragging-yline'></div>");
            g.mask = $("<div class='l-dragging-mask'></div>");
            g.layout.append(g.draggingxline).append(g.draggingyline).append(g.mask);
        },
        _setDropHandlePosition: function ()
        {
            var g = this, p = this.options;
            if (g.leftDropHandle)
            {
                g.leftDropHandle.css({ left: g.left.width() + parseInt(g.left.css('left')), height: g.middleHeight, top: g.middleTop });
            }
            if (g.rightDropHandle)
            {
                g.rightDropHandle.css({ left: parseInt(g.right.css('left')) - p.space, height: g.middleHeight, top: g.middleTop });
            }
            if (g.topDropHandle)
            {
                g.topDropHandle.css({ top: g.top.height() + parseInt(g.top.css('top')), width: g.top.width() });
            }
            if (g.bottomDropHandle)
            {
                g.bottomDropHandle.css({ top: parseInt(g.bottom.css('top')) - p.space, width: g.bottom.width() });
            }
            if (g.centerBottomDropHandle)
            {
                g.centerBottomDropHandle.css({
                    top: parseInt(g.centerBottom.css('top')) - p.space,
                    left: parseInt(g.center.css('left')),
                    width: g.center.width()
                });
            }
        },
        _onResize: function ()
        { 
            var g = this, p = this.options;
            var oldheight = g.layout.height(); 
            //set layout height 
            var h = 0;
            var windowHeight = $(window).height();
            var parentHeight = null;
            if (typeof (p.height) == "string" && p.height.indexOf('%') > 0)
            {
                var layoutparent = g.layout.parent();
                if (p.inWindow || layoutparent[0].tagName.toLowerCase() == "body")
                {
                    parentHeight = windowHeight;
                    parentHeight -= parseInt($('body').css('paddingTop'));
                    parentHeight -= parseInt($('body').css('paddingBottom'));
                }
                else
                {
                    parentHeight = layoutparent.height();
                }
                h = parentHeight * parseFloat(p.height) * 0.01;
                if (p.inWindow || layoutparent[0].tagName.toLowerCase() == "body")
                    h -= (g.layout.offset().top - parseInt($('body').css('paddingTop')));
            }
            else
            {
                h = parseInt(p.height);
            }
            h += p.heightDiff;
            g.layout.height(h);
            g.layoutHeight = g.layout.height();
            g.middleWidth = g.layout.width();
            g.middleHeight = g.layout.height();
            if (g.top)
            {
                g.middleHeight -= g.top.height();
                g.middleHeight -= parseInt(g.top.css('borderTopWidth'));
                g.middleHeight -= parseInt(g.top.css('borderBottomWidth'));
                g.middleHeight -= p.space;
            }
            if (g.bottom)
            {
                g.middleHeight -= g.bottom.height();
                g.middleHeight -= parseInt(g.bottom.css('borderTopWidth'));
                g.middleHeight -= parseInt(g.bottom.css('borderBottomWidth'));
                g.middleHeight -= p.space;
            }
            //specific
            g.middleHeight -= 2;

            if (g.hasBind('heightChanged') && g.layoutHeight != oldheight)
            {
                g.trigger('heightChanged', [{ layoutHeight: g.layoutHeight, diff: g.layoutHeight - oldheight, middleHeight: g.middleHeight}]);
            }

            if (g.center)
            {
                g.centerWidth = g.middleWidth;
                if (g.left)
                {
                    if (g.isLeftCollapse)
                    {
                        g.centerWidth -= g.leftCollapse.width();
                        g.centerWidth -= parseInt(g.leftCollapse.css('borderLeftWidth'));
                        g.centerWidth -= parseInt(g.leftCollapse.css('borderRightWidth'));
                        g.centerWidth -= parseInt(g.leftCollapse.css('left'));
                        g.centerWidth -= p.space;
                    }
                    else
                    {
                        g.centerWidth -= g.leftWidth;
                        g.centerWidth -= parseInt(g.left.css('borderLeftWidth'));
                        g.centerWidth -= parseInt(g.left.css('borderRightWidth'));
                        g.centerWidth -= parseInt(g.left.css('left'));
                        g.centerWidth -= p.space;
                    }
                }
                if (g.right)
                {
                    if (g.isRightCollapse)
                    {
                        g.centerWidth -= g.rightCollapse.width();
                        g.centerWidth -= parseInt(g.rightCollapse.css('borderLeftWidth'));
                        g.centerWidth -= parseInt(g.rightCollapse.css('borderRightWidth'));
                        g.centerWidth -= parseInt(g.rightCollapse.css('right'));
                        g.centerWidth -= p.space;
                    }
                    else
                    {
                        g.centerWidth -= g.rightWidth;
                        g.centerWidth -= parseInt(g.right.css('borderLeftWidth'));
                        g.centerWidth -= parseInt(g.right.css('borderRightWidth'));
                        g.centerWidth -= p.space;
                    }
                }
                g.centerLeft = 0;
                if (g.left)
                {
                    if (g.isLeftCollapse)
                    {
                        g.centerLeft += g.leftCollapse.width();
                        g.centerLeft += parseInt(g.leftCollapse.css('borderLeftWidth'));
                        g.centerLeft += parseInt(g.leftCollapse.css('borderRightWidth'));
                        g.centerLeft += parseInt(g.leftCollapse.css('left'));
                        g.centerLeft += p.space;
                    }
                    else
                    {
                        g.centerLeft += g.left.width();
                        g.centerLeft += parseInt(g.left.css('borderLeftWidth'));
                        g.centerLeft += parseInt(g.left.css('borderRightWidth'));
                        g.centerLeft += p.space;
                    }
                }
                g.center.css({ left: g.centerLeft });
                g.centerWidth >= 0 && g.center.width(g.centerWidth);
                g.middleHeight >= 0 && g.center.height(g.middleHeight);
                var contentHeight = g.middleHeight;
                if (g.center.header) contentHeight -= g.center.header.height();
                contentHeight >= 0 && g.center.content.height(contentHeight);
                 
                g._updateCenterBottom(true);
            }
            if (g.left)
            {
                g.leftCollapse.height(g.middleHeight);
                g.left.height(g.middleHeight);
            }
            if (g.right)
            {
                g.rightCollapse.height(g.middleHeight);
                g.right.height(g.middleHeight);
                //set left
                g.rightLeft = 0;

                if (g.left)
                {
                    if (g.isLeftCollapse)
                    {
                        g.rightLeft += g.leftCollapse.width();
                        g.rightLeft += parseInt(g.leftCollapse.css('borderLeftWidth'));
                        g.rightLeft += parseInt(g.leftCollapse.css('borderRightWidth'));
                        g.rightLeft += p.space;
                    }
                    else
                    {
                        g.rightLeft += g.left.width();
                        g.rightLeft += parseInt(g.left.css('borderLeftWidth'));
                        g.rightLeft += parseInt(g.left.css('borderRightWidth'));
                        g.rightLeft += parseInt(g.left.css('left'));
                        g.rightLeft += p.space;
                    }
                }
                if (g.center)
                {
                    g.rightLeft += g.center.width();
                    g.rightLeft += parseInt(g.center.css('borderLeftWidth'));
                    g.rightLeft += parseInt(g.center.css('borderRightWidth'));
                    g.rightLeft += p.space;
                }
                g.right.css({ left: g.rightLeft });
            }
            if (g.bottom)
            {
                g.bottomTop = g.layoutHeight - g.bottom.height() - 2;
                g.bottom.css({ top: g.bottomTop });
            }
            g._setDropHandlePosition();

        },
        //加了centerBottom以后，需要对centerBottom进行刷新处理一下
        _updateCenterBottom: function (isHeightResize)
        {
            var g = this, p = this.options;
            if (g.centerBottom)
            {
                if (isHeightResize)
                {
                    var centerBottomHeight = g.centerBottomHeight || p.centerBottomHeight;
                    g.centerBottom.css({ left: g.centerLeft });
                    g.centerWidth >= 0 && g.centerBottom.width(g.centerWidth);
                    var centerHeight = g.center.height(), centerTop = parseInt(g.center.css("top"));
                    g.centerBottom.height(centerBottomHeight)
                    g.centerBottom.css({ top: centerTop + centerHeight - centerBottomHeight + 2 });
                    g.center.height(centerHeight - centerBottomHeight - 2);
                }
                var centerLeft = parseInt(g.center.css("left"));
                g.centerBottom.width(g.center.width()).css({ left: centerLeft });
            }
        },
        _start: function (dragtype, e)
        {
            var g = this, p = this.options;
            g.dragtype = dragtype;
            if (dragtype == 'leftresize' || dragtype == 'rightresize')
            {
                g.xresize = { startX: e.pageX };
                g.draggingyline.css({ left: e.pageX - g.layout.offset().left, height: g.middleHeight, top: g.middleTop }).show();
                $('body').css('cursor', 'col-resize');
                g.mask.height(g.layout.height()).removeClass("l-layout-ymask").addClass("l-layout-xmask").show();
            }
            else if (dragtype == 'topresize' || dragtype == 'bottomresize')
            {
                g.yresize = { startY: e.pageY };
                g.draggingxline.css({ top: e.pageY - g.layout.offset().top, width: g.layout.width() }).show();
                $('body').css('cursor', 'row-resize'); 
                g.mask.height(g.layout.height()).removeClass("l-layout-xmask").addClass("l-layout-ymask").show();
            }
            else if (dragtype == 'centerbottomresize')
            {
                g.yresize = { startY: e.pageY };
                g.draggingxline.css({ top: e.pageY - g.layout.offset().top, width: g.layout.width() }).show();
                $('body').css('cursor', 'row-resize');
                g.mask.height(g.layout.height()).removeClass("l-layout-xmask").addClass("l-layout-ymask").show();
            }
            else
            {
                return;
            } 
            g.layout.lock.width(g.layout.width());
            g.layout.lock.height(g.layout.height());
            g.layout.lock.show();
            if ($.browser.msie || $.browser.safari) $('body').bind('selectstart', function () { return false; }); // 不能选择

            $(document).bind('mouseup', function ()
            {
                g._stop.apply(g, arguments);
            });
            $(document).bind('mousemove', function ()
            {
                g._drag.apply(g, arguments);
            });
        },
        _drag: function (e)
        {
            var g = this, p = this.options;
            if (g.xresize)
            {
                g.xresize.diff = e.pageX - g.xresize.startX;
                g.draggingyline.css({ left: e.pageX - g.layout.offset().left });
                $('body').css('cursor', 'col-resize'); 
            }
            else if (g.yresize)
            {
                g.yresize.diff = e.pageY - g.yresize.startY;
                g.draggingxline.css({ top: e.pageY - g.layout.offset().top });
                $('body').css('cursor', 'row-resize');
            }
        },
        _stop: function (e)
        {
            var g = this, p = this.options;
            var diff;
            if (g.xresize && g.xresize.diff != undefined)
            {
                diff = g.xresize.diff;
                if (g.dragtype == 'leftresize')
                {
                    if (p.minLeftWidth)
                    {
                        if (g.leftWidth + g.xresize.diff < p.minLeftWidth)
                            return;
                    }
                    g.leftWidth += g.xresize.diff;
                    g.left.width(g.leftWidth);
                    if (g.center)
                        g.center.width(g.center.width() - g.xresize.diff).css({ left: parseInt(g.center.css('left')) + g.xresize.diff });
                    else if (g.right)
                        g.right.width(g.left.width() - g.xresize.diff).css({ left: parseInt(g.right.css('left')) + g.xresize.diff }); 
                }
                else if (g.dragtype == 'rightresize')
                {
                    if (p.minRightWidth)
                    {
                        if (g.rightWidth - g.xresize.diff < p.minRightWidth)
                            return;
                    }
                    g.rightWidth -= g.xresize.diff;
                    g.right.width(g.rightWidth).css({ left: parseInt(g.right.css('left')) + g.xresize.diff });
                    if (g.center)
                        g.center.width(g.center.width() + g.xresize.diff);
                    else if (g.left)
                        g.left.width(g.left.width() + g.xresize.diff);
                }
                g._updateCenterBottom();
            }
            else if (g.yresize && g.yresize.diff != undefined)
            {
                diff = g.yresize.diff;
                if (g.dragtype == 'topresize')
                {
                    g.top.height(g.top.height() + g.yresize.diff);
                    g.middleTop += g.yresize.diff;
                    g.middleHeight -= g.yresize.diff;
                    if (g.left)
                    {
                        g.left.css({ top: g.middleTop }).height(g.middleHeight);
                        g.leftCollapse.css({ top: g.middleTop }).height(g.middleHeight);
                    }
                    if (g.center) g.center.css({ top: g.middleTop }).height(g.middleHeight);
                    if (g.right)
                    {
                        g.right.css({ top: g.middleTop }).height(g.middleHeight);
                        g.rightCollapse.css({ top: g.middleTop }).height(g.middleHeight);
                    }
                    g._updateCenterBottom(true);
                }
                else if (g.dragtype == 'bottomresize')
                {
                    g.bottom.height(g.bottom.height() - g.yresize.diff);
                    g.middleHeight += g.yresize.diff;
                    g.bottomTop += g.yresize.diff;
                    g.bottom.css({ top: g.bottomTop });
                    if (g.left)
                    {
                        g.left.height(g.middleHeight);
                        g.leftCollapse.height(g.middleHeight);
                    }
                    if (g.center) g.center.height(g.middleHeight);
                    if (g.right)
                    {
                        g.right.height(g.middleHeight);
                        g.rightCollapse.height(g.middleHeight);
                    }
                    g._updateCenterBottom(true);
                }
                else if (g.dragtype == 'centerbottomresize')
                {
                    g.centerBottomHeight = g.centerBottomHeight || p.centerBottomHeight;
                    g.centerBottomHeight -= g.yresize.diff; 
                    var centerBottomTop = parseInt(g.centerBottom.css("top"));
                    g.centerBottom.css("top" , centerBottomTop + g.yresize.diff);
                    g.centerBottom.height(g.centerBottom.height() - g.yresize.diff);    
                    g.center.height(g.center.height() + g.yresize.diff); 
                }
            }
            g.trigger('endResize', [{
                direction: g.dragtype ? g.dragtype.replace(/resize/, '') : '',
                diff: diff
            }, e]);
            g._setDropHandlePosition();
            g.draggingxline.hide();
            g.draggingyline.hide();
            g.mask.hide();
            g.xresize = g.yresize = g.dragtype = false;
            g.layout.lock.hide();
            if ($.browser.msie || $.browser.safari)
                $('body').unbind('selectstart');
            $(document).unbind('mousemove', g._drag);
            $(document).unbind('mouseup', g._stop);
            $('body').css('cursor', '');

        }
    });

})(jQuery);﻿/**
* jQuery zoeUI 1.0.0
* 
*  zoeListBox
* 
*/
(function ($)
{

    $.fn.zoeListBox = function (options)
    {
        return $.zoeui.run.call(this, "zoeListBox", arguments);
    }; 
    $.fn.zoeGetListBoxManager = function ()
    {
        return $.zoeui.run.call(this, "zoeGetListBoxManager", arguments);
    };

    $.zoeDefaults.ListBox = {
        isMultiSelect: false,   //是否多选
        isShowCheckBox: false,  //是否选择复选框
        columns: null,          //表格状态
        width: 150,            //宽度
        height: 100,           //高度
        onSelect: false,        //选择前事件
        onSelected: null,       //选择值事件  
        valueField: 'id',       //值成员
        textField: 'text',      //显示成员
        valueFieldID: null,     //值 隐藏域 表单名 
        split: ";",             //分隔符
        data: null,             //数据  
        parms: null,            //ajax提交表单 
        url: null,              //数据源URL(需返回JSON)
        onSuccess: null,
        onError: null,
        render: null,            //显示html自定义函数 
        css: null,               //附加css  
        value: null,            //值 
        valueFieldCssClass: null
    };

    //扩展方法
    $.zoeMethos.ListBox = $.zoeMethos.ListBox || {};


    $.zoeui.controls.ListBox = function (element, options)
    {
        $.zoeui.controls.ListBox.base.constructor.call(this, element, options);
    };
    $.zoeui.controls.ListBox.zoeExtend($.zoeui.controls.Input, {
        __getType: function ()
        {
            return 'ListBox';
        },
        _extendMethods: function ()
        {
            return $.zoeMethos.ListBox;
        },
        _init: function ()
        {
            $.zoeui.controls.ListBox.base._init.call(this); 
        },
        _render: function ()
        {
            var g = this, p = this.options; 
            g.data = p.data;    
            g.valueField = null; //隐藏域(保存值) 
               
            if (p.valueFieldID)
            {
                g.valueField = $("#" + p.valueFieldID + ":input,[name=" + p.valueFieldID + "]:input");
                if (g.valueField.length == 0) g.valueField = $('<input type="hidden"/>');
                g.valueField[0].id = g.valueField[0].name = p.valueFieldID;
            }
            else
            {
                g.valueField = $('<input type="hidden"/>');
                g.valueField[0].id = g.valueField[0].name = g.id + "_val";
            }
            if (g.valueField[0].name == null) g.valueField[0].name = g.valueField[0].id;
            if (p.valueFieldCssClass)
            {
                g.valueField.addClass(p.valueFieldCssClass);
            }
            g.valueField.attr("data-zoeid", g.id);
            //选择框框
            g.selectBox = $(this.element);
            g.selectBox.html('<div class="l-listbox-inner"><table cellpadding="0" cellspacing="0" border="0" class="l-listbox-table"></table></div>').addClass("l-listbox").append(g.valueField);
            g.selectBox.table = $("table:first", g.selectBox); 
              
            g.set(p); 

            g._addClickEven();
        },
        destroy: function ()
        { 
            if (this.selectBox) this.selectBox.remove();
            this.options = null;
            $.zoeui.remove(this);
        },
        clear : function()
        {
            this._changeValue("");
            this.trigger('clear');
        },
        _setIsShowCheckBox : function(value)
        {
            if (value)
            {
                $("table", this.selectBox).addClass("l-table-checkbox");
            } else
            { 
                $("table", this.selectBox).addClass("l-table-nocheckbox");
            }
        },
        _setCss: function (css)
        {
            if (css)
            {
                this.selectBox.addClass(css);
            } 
        }, 
        _setDisabled: function (value)
        {
            //禁用样式
            if (value)
            {
                this.selectBox.addClass('l-text-disabled');
            } else
            {
                this.selectBox.removeClass('l-text-disabled');
            }
        }, 
        _setWidth: function (value)
        {
            this.selectBox.width(value);
        },
        _setHeight: function (value)
        {
            this.selectBox.height(value);
        }, 
        //查找Text,适用多选和单选
        findTextByValue: function (value)
        {
            var g = this, p = this.options;
            if (value == null) return "";
            var texts = "";
            var contain = function (checkvalue)
            {
                var targetdata = value.toString().split(p.split);
                for (var i = 0; i < targetdata.length; i++)
                {
                    if (targetdata[i] == checkvalue) return true;
                }
                return false;
            };
            $(g.data).each(function (i, item)
            {
                var val = item[p.valueField];
                var txt = item[p.textField];
                if (contain(val))
                {
                    texts += txt + p.split;
                }
            });
            if (texts.length > 0) texts = texts.substr(0, texts.length - 1);
            return texts;
        },
        getDataByValue: function (value)
        {
            var g = this, p = this.options;
            for (var i = 0, l = g.data.length; i < l; i++)
            {
                if (g.data[i][p.valueField] == value) return g.data[i];
            }
            return null;
        },
        indexOf: function (item)
        {
            var g = this, p = this.options;
            if (!g.data) return -1;
            var isObj = typeof (item) == "object";
            for (var i = 0, l = g.data.length; i < l; i++)
            {
                if (isObj)
                {
                    if (g.data[i] == item) return i;
                } else
                {
                    if (g.data[i][p.valueField] && g.data[i][p.valueField].toString() == item.toString()) return i;
                }
            }
            return -1;
        },
        removeItems : function(items)
        {
            var g = this;
            if (!g.data) return;
            $(items).each(function (i,item)
            {
                var index = g.indexOf(item);
                if (index == -1) return;
                g.data.splice(index, 1);
            });
            g.refresh();
        },
        removeItem: function (item)
        {
            if (!this.data) return;
            var index = this.indexOf(item);
            if (index == -1) return;
            this.data.splice(index, 1);
            this.refresh();
        },
        insertItem: function (item,index)
        {
            var g = this;
            if (!g.data) g.data = []; 
            g.data.splice(index, 0, item);
            g.refresh();
        },
        addItems: function (items)
        {
            var g = this;
            if (!g.data) g.data = [];
            $(items).each(function (i, item)
            {
                g.data.push(item);
            });
            g.refresh();
        },
        addItem: function (item)
        {
            var g = this;
            if (!g.data) g.data = [];
            g.data.push(item);
            g.refresh();
        }, 
        getSelectedItems: function()
        {
            var g = this, p = this.options; 
            if (!g.data) return null;
            var value = g.getValue();
            if (!value) return null;
            var items = [];
            $(value.split(p.split)).each(function ()
            {
                var index = g.indexOf(this.toString());
                if (index != -1) items.push(g.data[index]);
            });
            return items;
        },
        _setValue: function (value)
        {
            var g = this, p = this.options; 
            p.value = value;
            this._dataInit();
        },
        setValue: function (value)
        { 
            this._setValue(value);
        },
        _setUrl: function (url)
        {
            if (!url) return;
            var g = this, p = this.options; 
            $.ajax({
                type: 'post',
                url: url,
                data: p.parms,
                cache: false,
                dataType: 'json',
                success: function (data)
                {
                    g.setData(data);
                    g.trigger('success', [data]);
                },
                error: function (XMLHttpRequest, textStatus)
                {
                    g.trigger('error', [XMLHttpRequest, textStatus]);
                }
            });
        },
        setUrl: function (url)
        {
            return this._setUrl(url);
        },
        setParm: function (name, value)
        {
            if (!name) return;
            var g = this;
            var parms = g.get('parms');
            if (!parms) parms = {};
            parms[name] = value;
            g.set('parms', parms); 
        },
        clearContent: function ()
        {
            var g = this, p = this.options;
            $("table", g.selectBox).html(""); 
        },
        _setColumns : function(columns)
        {
            var g = this, p = this.options;
            p.columns = columns;
            g.refresh();
        },
        _setData : function(data)
        {
            this.setData(data);
        },
        setData: function (data)
        {
            var g = this, p = this.options; 
            if (!data || !data.length) return;
            g.data = data;
            g.refresh();
            g.updateStyle();
        },
        refresh:function()
        {
            var g = this, p = this.options, data = this.data; 
            this.clearContent();
            if (!data) return;
            if (p.columns)
            {
                g.selectBox.table.headrow = $("<tr class='l-table-headerow'><td width='18px' class='l-checkboxrow'></td></tr>");
                g.selectBox.table.append(g.selectBox.table.headrow);
                g.selectBox.table.addClass("l-listbox-grid");
                for (var j = 0; j < p.columns.length; j++)
                {
                    var headrow = $("<td columnindex='" + j + "' columnname='" + p.columns[j].name + "'>" + p.columns[j].header + "</td>");
                    if (p.columns[j].width)
                    {
                        headrow.width(p.columns[j].width);
                    }
                    g.selectBox.table.headrow.append(headrow);

                }
            }
            var out = [];
            for (var i = 0; i < data.length; i++)
            {
                var val = data[i][p.valueField];
                var txt = data[i][p.textField];
                var valueIndexStr = " value='" + val + "' index='" + i + "'";
                if (!p.columns)
                {
                    out.push("<tr " + valueIndexStr + ">");
                    out.push("<td style='width:18px;' class='l-checkboxrow'><input type='checkbox'" + valueIndexStr + "/></td>");
                    var itemHtml = txt;
                    if (p.render)
                    {
                        itemHtml = p.render({
                            data: data[i],
                            value: val,
                            text: txt 
                        });
                    } 
                    out.push("<td align='left'>" + itemHtml + "</td></tr>");
                } else
                {
                    out.push("<tr " + valueIndexStr + "><td style='width:18px;' class='l-checkboxrow'><input type='checkbox' " + valueIndexStr + "/></td>");
                    for (var j = 0; j < p.columns.length; j++)
                    {
                        var columnname = p.columns[j].name;
                        out.push("<td>" + data[i][columnname] + "</td>");
                    }
                    out.push('</tr>');  
                }
            } 
            g.selectBox.table.append(out.join(''));
        },
        _getValue: function ()
        {
            return $(this.valueField).val();
        },
        getValue: function ()
        {
            //获取值
            return this._getValue();
        },  
        updateStyle: function ()
        { 
            this._dataInit();
        },
        selectAll: function ()
        {
            var g = this, p = this.options; 
            var values = [];
            $("tr", g.selectBox).each(function ()
            {
                var jrow = $(this);
                values.push(jrow.attr("value"));
            }); 
            $("tr", g.selectBox).addClass("l-selected").find(":checkbox").each(function () { this.checked = true; });
            g.valueField.val(values.join(p.split));
        },
        _dataInit: function ()
        {
            var g = this, p = this.options;
            var value = p.value;
            //根据值来初始化
            if (value != null)
            {
                g._changeValue(value);
            } 
            else if (g.valueField.val() != "")
            {
                p.value = g.valueField.val();  
            } 
            var valueArr = (value || "").toString().split(p.split);

            $("tr.l-selected", g.selectBox)
                   .removeClass("l-selected")
                   .find(":checkbox").each(function () { this.checked = false; });
            $(valueArr).each(function (i, item)
            {
                $("tr[value='" + item + "']", g.selectBox)
                    .addClass("l-selected")
                    .find(":checkbox").each(function () { this.checked = true; });
            }); 
        },
        //设置值到 隐藏域
        _changeValue: function (newValue)
        {
            var g = this, p = this.options; 
            g.valueField.val(newValue); 
            g.selectedValue = newValue;
        },
        //更新值到隐藏域
        _updateValue: function ()
        {
            var g = this, p = this.options;
            var values = [];
            $("tr", g.selectBox).each(function ()
            {
                var jrow = $(this);
                if (jrow.hasClass("l-selected"))
                {
                    values.push(jrow.attr("value"));
                }
            }); 
            g._changeValue(values.join(p.split));
        },
        _addClickEven: function ()
        {
            var g = this, p = this.options;
            //选项点击
            g.selectBox.click(function (e)
            {  
                var obj = (e.target || e.srcElement); 
                var jrow = $(obj).parents("tr:first");
                if (!jrow.length) return;
                var value = jrow.attr("value");
                var text = g.findTextByValue(value), data = g.getDataByValue(value);
                if (g.hasBind('select'))
                {
                    if (g.trigger('select', [value, text, data]) == false)
                    {
                        return false;
                    }
                }
                if (!p.isMultiSelect)
                {
                    $("tr.l-selected", g.selectBox).not(jrow)
                        .removeClass("l-selected")
                        .find(":checkbox").each(function () { this.checked = false });
                }
                if (jrow.hasClass("l-selected"))
                {
                    jrow.removeClass("l-selected");
                } else
                {
                    jrow.addClass("l-selected");
                }
                jrow.find(":checkbox").each(function () { this.checked = jrow.hasClass("l-selected"); });
                g._updateValue();
                g.trigger('selected', [value, text, data]);
            });
        } 
    });
      

})(jQuery);﻿/**
* jQuery zoeUI 1.0.0
* 
* 
*  
* 
* 
*/
(function ($)
{
    $.zoeMenu = function (options)
    {
        return $.zoeui.run.call(null, "zoeMenu", arguments);
    };
    $.fn.zoeGetMenuManager = function ()
    {
        return $.zoeui.run.call(this, "zoeGetMenuManager", arguments);
    };

    $.zoeDefaults.Menu = {
        width: 120,
        top: 0,
        left: 0,
        items: null,
        shadow: true
    };

    $.zoeMethos.Menu = {};

    $.zoeui.controls.Menu = function (options)
    {
        $.zoeui.controls.Menu.base.constructor.call(this, null, options);
    };
    $.zoeui.controls.Menu.zoeExtend($.zoeui.core.UIComponent, {
        __getType: function ()
        {
            return 'Menu';
        },
        __idPrev: function ()
        {
            return 'Menu';
        },
        _extendMethods: function ()
        {
            return $.zoeMethos.Menu;
        },
        _render: function ()
        {
            var g = this, p = this.options;
            g.menuItemCount = 0;
            //全部菜单
            g.menus = {};
            //顶级菜单
            g.menu = g.createMenu();
            g.element = g.menu[0];
            g.menu.css({ top: p.top, left: p.left, width: p.width });

            p.items && $(p.items).each(function (i, item)
            {
                g.addItem(item);
            });

            $(document).bind('click.menu', function ()
            {
                for (var menuid in g.menus)
                {
                    var menu = g.menus[menuid];
                    if (!menu) return;
                    menu.hide();
                    $(".l-menu-over").css({ top: -24 });
                    $('.l-menu-item').removeClass('l-menu-item-over');
                    if (menu.shadow) menu.shadow.hide();
                }
            });
            g.set(p);
        },
        show: function (options, menu)
        {
            var g = this, p = this.options;
            if (menu == undefined) menu = g.menu;
            if (options && options.left != undefined)
            {
                menu.css({ left: options.left });
            }
            if (options && options.top != undefined)
            {
                menu.css({ top: options.top });
            }
            menu.show();
            g.updateShadow(menu);
        },
        updateShadow: function (menu)
        {
            var g = this, p = this.options;
            if (!p.shadow) return;
            menu.shadow.css({
                left: menu.css('left'),
                top: menu.css('top'),
                width: menu.outerWidth(),
                height: menu.outerHeight()
            });
            if (menu.is(":visible"))
                menu.shadow.show();
            else
                menu.shadow.hide();
        },
        hide: function (menu)
        {
            var g = this, p = this.options;
            if (menu == undefined) menu = g.menu;
            g.hideAllSubMenu(menu);
            menu.hide();
            g.updateShadow(menu);
        },
        toggle: function ()
        {
            var g = this, p = this.options;
            g.menu.toggle();
            g.updateShadow(g.menu);
        },
        removeItem: function (itemid)
        {
            var g = this, p = this.options;
            $("> .l-menu-item[menuitemid=" + itemid + "]", g.menu.items).remove();
        },
        setEnabled: function (itemid)
        {
            var g = this, p = this.options;
            $("> .l-menu-item[menuitemid=" + itemid + "]", g.menu.items).removeClass("l-menu-item-disable");
        },
        setMenuText : function(itemid,text)
        {
            var g = this, p = this.options;
            $("> .l-menu-item[menuitemid=" + itemid + "] >.l-menu-item-text:first", g.menu.items).html(text);
        },
        setDisabled: function (itemid)
        {
            var g = this, p = this.options;
            $("> .l-menu-item[menuitemid=" + itemid + "]", g.menu.items).addClass("l-menu-item-disable");
        },
        isEnable: function (itemid)
        {
            var g = this, p = this.options;
            return !$("> .l-menu-item[menuitemid=" + itemid + "]", g.menu.items).hasClass("l-menu-item-disable");
        },
        getItemCount: function ()
        {
            var g = this, p = this.options;
            return $("> .l-menu-item", g.menu.items).length;
        },
        addItem: function (item, menu)
        {
            var g = this, p = this.options;
            if (!item) return;
            if (menu == undefined) menu = g.menu;

            if (item.line)
            {
                menu.items.append('<div class="l-menu-item-line"></div>');
                return;
            }
            var ditem = $('<div class="l-menu-item"><div class="l-menu-item-text"></div> </div>');
            var itemcount = $("> .l-menu-item", menu.items).length;
            menu.items.append(ditem);
            ditem.attr("zoeuimenutemid", ++g.menuItemCount);
            item.id && ditem.attr("menuitemid", item.id);
            item.text && $(">.l-menu-item-text:first", ditem).html(item.text);
            item.icon && ditem.prepend('<div class="l-menu-item-icon l-icon-' + item.icon + '"></div>');
            item.img && ditem.prepend('<div class="l-menu-item-icon"><img style="width:16px;height:16px;margin:2px;" src="' + item.img + '" /></div>');
            if (item.disable || item.disabled)
                ditem.addClass("l-menu-item-disable");
            if (item.children)
            {
                ditem.append('<div class="l-menu-item-arrow"></div>');
                var newmenu = g.createMenu(ditem.attr("zoeuimenutemid"));
                g.menus[ditem.attr("zoeuimenutemid")] = newmenu;
                newmenu.width(p.width);
                newmenu.hover(null, function ()
                {
                    if (!newmenu.showedSubMenu)
                        g.hide(newmenu);
                });
                $(item.children).each(function ()
                {
                    g.addItem(this, newmenu);
                });
            }
            item.click && ditem.click(function ()
            {
                if ($(this).hasClass("l-menu-item-disable")) return;
                item.click(item, itemcount);
            });
            item.dblclick && ditem.dblclick(function ()
            {
                if ($(this).hasClass("l-menu-item-disable")) return;
                item.dblclick(item, itemcount);
            });

            var menuover = $("> .l-menu-over:first", menu);
            ditem.hover(function ()
            {
                if ($(this).hasClass("l-menu-item-disable")) return;
                var itemtop = $(this).offset().top;
                var top = itemtop - menu.offset().top;
                menuover.css({ top: top });
                $(this).siblings().removeClass('l-menu-item-over');
                $(this).addClass('l-menu-item-over');
                g.hideAllSubMenu(menu);
                if (item.children)
                {
                    var zoeuimenutemid = $(this).attr("zoeuimenutemid");
                    if (!zoeuimenutemid) return;
                    if (g.menus[zoeuimenutemid])
                    {
                        g.show({ top: itemtop, left: $(this).offset().left + $(this).width() - 5 }, g.menus[zoeuimenutemid]);
                        menu.showedSubMenu = true;
                    }
                }
            }, function ()
            {
                if ($(this).hasClass("l-menu-item-disable")) return;
                var zoeuimenutemid = $(this).attr("zoeuimenutemid");
                
                if (item.children)
                {
                    var zoeuimenutemid = $(this).attr("zoeuimenutemid");
                    if (!zoeuimenutemid) return;
                }else{
                    $(this).removeClass('l-menu-item-over');
                };
            });
        },
        hideAllSubMenu: function (menu)
        {
            var g = this, p = this.options;
            if (menu == undefined) menu = g.menu;
            $("> .l-menu-item", menu.items).each(function ()
            {
                if ($("> .l-menu-item-arrow", this).length > 0)
                {
                    var zoeuimenutemid = $(this).attr("zoeuimenutemid");
                    if (!zoeuimenutemid) return;
                    g.menus[zoeuimenutemid] && g.hide(g.menus[zoeuimenutemid]);
                }
            });
            menu.showedSubMenu = false;
        },
        createMenu: function (parentMenuItemID)
        {
            var g = this, p = this.options;
            var menu = $('<div class="l-menu" style="display:none"><div class="l-menu-yline"></div><div class="l-menu-over"><div class="l-menu-over-l"></div> <div class="l-menu-over-r"></div></div><div class="l-menu-inner"></div></div>');
            parentMenuItemID && menu.attr("zoeuiparentmenuitemid", parentMenuItemID);
            menu.items = $("> .l-menu-inner:first", menu);
            menu.appendTo('body');
            if (p.shadow)
            {
                menu.shadow = $('<div class="l-menu-shadow"></div>').insertAfter(menu);
                g.updateShadow(menu);
            }
            menu.hover(null, function ()
            {
                if (!menu.showedSubMenu)
                    $("> .l-menu-over:first", menu).css({ top: -24 });
            });
            if (parentMenuItemID)
                g.menus[parentMenuItemID] = menu;
            else
                g.menus[0] = menu;
            return menu;
        }
    });
    //旧写法保留
    $.zoeui.controls.Menu.prototype.setEnable = $.zoeui.controls.Menu.prototype.setEnabled;
    $.zoeui.controls.Menu.prototype.setDisable = $.zoeui.controls.Menu.prototype.setDisabled;



})(jQuery);﻿/**
* jQuery zoeUI 1.0.0
* 
* 
*  
* 
* 
*/
(function ($)
{
    $.fn.zoeMenuBar = function (options)
    {
        return $.zoeui.run.call(this, "zoeMenuBar", arguments);
    };
    $.fn.zoeGetMenuBarManager = function ()
    {
        return $.zoeui.run.call(this, "zoeGetMenuBarManager", arguments);
    };

    $.zoeDefaults.MenuBar = {};

    $.zoeMethos.MenuBar = {};

    $.zoeui.controls.MenuBar = function (element, options)
    {
        $.zoeui.controls.MenuBar.base.constructor.call(this, element, options);
    };
    $.zoeui.controls.MenuBar.zoeExtend($.zoeui.core.UIComponent, {
        __getType: function ()
        {
            return 'MenuBar';
        },
        __idPrev: function ()
        {
            return 'MenuBar';
        },
        _extendMethods: function ()
        {
            return $.zoeMethos.MenuBar;
        },
        _render: function ()
        {
            var g = this, p = this.options;
            g.menubar = $(this.element);
            if (!g.menubar.hasClass("l-menubar")) g.menubar.addClass("l-menubar");
            if (p && p.items)
            {
                $(p.items).each(function (i, item)
                {
                    g.addItem(item);
                });
            }
            $(document).click(function ()
            {
                $(".l-panel-btn-selected", g.menubar).removeClass("l-panel-btn-selected");
            });
            g.set(p);
        },
        addItem: function (item)
        {
            var g = this, p = this.options;
            var ditem = $('<div class="l-menubar-item l-panel-btn"><span></span><div class="l-panel-btn-l"></div><div class="l-panel-btn-r"></div><div class="l-menubar-item-down"></div></div>');
            g.menubar.append(ditem);
            item.id && ditem.attr("menubarid", item.id);
            item.text && $("span:first", ditem).html(item.text);
            item.disable && ditem.addClass("l-menubar-item-disable");
            item.click && ditem.click(function () { item.click(item); });
            if (item.menu)
            {
                var menu = $.zoeMenu(item.menu);
                ditem.hover(function ()
                {
                    g.actionMenu && g.actionMenu.hide();
                    var left = $(this).offset().left;
                    var top = $(this).offset().top + $(this).height();
                    menu.show({ top: top, left: left });
                    g.actionMenu = menu;
                    $(this).addClass("l-panel-btn-over l-panel-btn-selected").siblings(".l-menubar-item").removeClass("l-panel-btn-selected");
                }, function ()
                {
                    $(this).removeClass("l-panel-btn-over");
                });
            }
            else
            {
                ditem.hover(function ()
                {
                    $(this).addClass("l-panel-btn-over");
                }, function ()
                {
                    $(this).removeClass("l-panel-btn-over");
                });
                $(".l-menubar-item-down", ditem).remove();
            }

        }
    });

})(jQuery);﻿/**
* jQuery zoeUI 1.0.0
* 
* 
*  
* 
* 
*/
(function ($)
{

    $.zoeMessageBox = function (options)
    {
        return $.zoeui.run.call(null, "zoeMessageBox", arguments, { isStatic: true });
    };


    $.zoeDefaults.MessageBox = {
        isDrag: true
    };

    $.zoeMethos.MessageBox = {};

    $.zoeui.controls.MessageBox = function (options)
    {
        $.zoeui.controls.MessageBox.base.constructor.call(this, null, options);
    };
    $.zoeui.controls.MessageBox.zoeExtend($.zoeui.core.UIComponent, {
        __getType: function ()
        {
            return 'MessageBox';
        },
        __idPrev: function ()
        {
            return 'MessageBox';
        },
        _extendMethods: function ()
        {
            return $.zoeMethos.MessageBox;
        },
        _render: function ()
        {
            var g = this, p = this.options;
            var messageBoxHTML = "";
            messageBoxHTML += '<div class="l-messagebox">';
            messageBoxHTML += '        <div class="l-messagebox-lt"></div><div class="l-messagebox-rt"></div>';
            messageBoxHTML += '        <div class="l-messagebox-l"></div><div class="l-messagebox-r"></div> ';
            messageBoxHTML += '        <div class="l-messagebox-image"></div>';
            messageBoxHTML += '        <div class="l-messagebox-title">';
            messageBoxHTML += '            <div class="l-messagebox-title-inner"></div>';
            messageBoxHTML += '            <div class="l-messagebox-close"></div>';
            messageBoxHTML += '        </div>';
            messageBoxHTML += '        <div class="l-messagebox-content">';
            messageBoxHTML += '        </div>';
            messageBoxHTML += '        <div class="l-messagebox-buttons"><div class="l-messagebox-buttons-inner">';
            messageBoxHTML += '        </div></div>';
            messageBoxHTML += '    </div>';
            g.messageBox = $(messageBoxHTML);
            $('body').append(g.messageBox);
            g.messageBox.close = function ()
            {
                g._removeWindowMask();
                g.messageBox.remove();
            };
            //设置参数属性
            p.width && g.messageBox.width(p.width);
            p.title && $(".l-messagebox-title-inner", g.messageBox).html(p.title);
            p.content && $(".l-messagebox-content", g.messageBox).html(p.content);
            if (p.buttons)
            {
                $(p.buttons).each(function (i, item)
                {
                    var btn = $('<div class="l-messagebox-btn"><div class="l-messagebox-btn-l"></div><div class="l-messagebox-btn-r"></div><div class="l-messagebox-btn-inner"></div></div>');
                    $(".l-messagebox-btn-inner", btn).html(item.text);
                    $(".l-messagebox-buttons-inner", g.messageBox).prepend(btn);
                    item.width && btn.width(item.width);
                    item.onclick && btn.click(function () { item.onclick(item, i, g.messageBox) });
                });
                $(".l-messagebox-buttons-inner", g.messageBox).append("<div class='l-clear'></div>");
            }
            var boxWidth = g.messageBox.width();
            var sumBtnWidth = 0;
            $(".l-messagebox-buttons-inner .l-messagebox-btn", g.messageBox).each(function ()
            {
                sumBtnWidth += $(this).width();
            });
            $(".l-messagebox-buttons-inner", g.messageBox).css({ marginLeft: parseInt((boxWidth - sumBtnWidth) * 0.5) });
            //设置背景、拖动支持 和设置图片
            g._applyWindowMask();
            g._applyDrag();
            g._setImage();

            //位置初始化
            var left = 0;
            var top = 0;
            var width = p.width || g.messageBox.width();
            if (p.left != null) left = p.left;
            else p.left = left = 0.5 * ($(window).width() - width);
            if (p.top != null) top = p.top;
            else p.top = top = 0.5 * ($(window).height() - g.messageBox.height()) + $(window).scrollTop() - 10;
            if (left < 0) p.left = left = 0;
            if (top < 0) p.top = top = 0;
            g.messageBox.css({ left: left, top: top });

            //设置事件
            $(".l-messagebox-btn", g.messageBox).hover(function ()
            {
                $(this).addClass("l-messagebox-btn-over");
            }, function ()
            {
                $(this).removeClass("l-messagebox-btn-over");
            });
            $(".l-messagebox-close", g.messageBox).hover(function ()
            {
                $(this).addClass("l-messagebox-close-over");
            }, function ()
            {
                $(this).removeClass("l-messagebox-close-over");
            }).click(function ()
            {
                g.messageBox.close();
            });
            g.set(p);
        },
        close: function ()
        {
            var g = this, p = this.options;
            this.g._removeWindowMask();
            this.messageBox.remove();
        },
        _applyWindowMask: function ()
        {
            var g = this, p = this.options;
            $(".l-window-mask").remove();
            $("<div class='l-window-mask' style='display: block;'></div>").appendTo($("body"));
        },
        _removeWindowMask: function ()
        {
            var g = this, p = this.options;
            $(".l-window-mask").remove();
        },
        _applyDrag: function ()
        {
            var g = this, p = this.options;
            if (p.isDrag && $.fn.zoeDrag)
                g.messageBox.zoeDrag({ handler: '.l-messagebox-title-inner', animate: false });
        },
        _setImage: function ()
        {
            var g = this, p = this.options;
            if (p.type)
            {
                if (p.type == 'success' || p.type == 'donne')
                {
                    $(".l-messagebox-image", g.messageBox).addClass("l-messagebox-image-donne").show();
                    //$(".l-messagebox-content", g.messageBox).css({ paddingLeft: 64, paddingBottom: 30 });
                }
                else if (p.type == 'error')
                {
                    $(".l-messagebox-image", g.messageBox).addClass("l-messagebox-image-error").show();
                    //$(".l-messagebox-content", g.messageBox).css({ paddingLeft: 64, paddingBottom: 30 });
                }
                else if (p.type == 'warn')
                {
                    $(".l-messagebox-image", g.messageBox).addClass("l-messagebox-image-warn").show();
                    //$(".l-messagebox-content", g.messageBox).css({ paddingLeft: 64, paddingBottom: 30 });
                }
                else if (p.type == 'question')
                {
                    $(".l-messagebox-image", g.messageBox).addClass("l-messagebox-image-question").show();
                    //$(".l-messagebox-content", g.messageBox).css({ paddingLeft: 64, paddingBottom: 40 });
                }
            }
        }
    });


    $.zoeMessageBox.show = function (p)
    {
        return $.zoeMessageBox(p);
    };
    $.zoeMessageBox.alert = function (title, content, type, onBtnClick)
    {
        title = title || "";
        content = content || title;
        var onclick = function (item, index, messageBox)
        {
            messageBox.close();
            if (onBtnClick)
                onBtnClick(item, index, messageBox);
        };
        p = {
            title: title,
            content: content,
            buttons: [{ text: '确定', onclick: onclick}]
        };
        if (type) p.type = type;
        return $.zoeMessageBox(p);
    };
    $.zoeMessageBox.confirm = function (title, content, callback)
    {
        var onclick = function (item, index, messageBox)
        {
            messageBox.close();
            if (callback)
            {
                callback(index == 0);
            }
        };
        p = {
            type: 'question',
            title: title,
            content: content,
            buttons: [{ text: '确定', onclick: onclick }, { text: '取消', onclick: onclick}]
        };
        return $.zoeMessageBox(p);
    };
    $.zoeMessageBox.success = function (title, content, onBtnClick)
    {
        return $.zoeMessageBox.alert(title, content, 'success', onBtnClick);
    };
    $.zoeMessageBox.error = function (title, content, onBtnClick)
    {
        return $.zoeMessageBox.alert(title, content, 'error', onBtnClick);
    };
    $.zoeMessageBox.warn = function (title, content, onBtnClick)
    {
        return $.zoeMessageBox.alert(title, content, 'warn', onBtnClick);
    };
    $.zoeMessageBox.question = function (title, content)
    {
        return $.zoeMessageBox.alert(title, content, 'question');
    };


})(jQuery);﻿/**
* jQuery zoeUI 1.0.0
* 
* zoePanel
*/
(function ($)
{

    $.fn.zoePanel = function (options)
    {
        return $.zoeui.run.call(this, "zoePanel", arguments);
    };
    $.fn.zoeGetPanelManager = function ()
    {
        return $.zoeui.run.call(this, "zoeGetPanelManager", arguments);
    };

    $.zoeDefaults.Panel = {
        width: 400,
        height : 300,
        title: 'Panel',
        content: null,      //内容
        url: null,          //远程内容Url
        frameName: null,     //创建iframe时 作为iframe的name和id 
        data: null,          //可用于传递到iframe的数据
        showClose: false,    //是否显示关闭按钮
        showToggle: true,    //是否显示收缩按钮 
        icon: null,          //左侧按钮
        onClose:null,       //关闭前事件
        onClosed:null,      //关闭事件
        onLoaded:null           //url模式 加载完事件
    };

    $.zoeMethos.Panel = {};

    $.zoeui.controls.Panel = function (element, options)
    {
        $.zoeui.controls.Panel.base.constructor.call(this, element, options);
    };
    $.zoeui.controls.Panel.zoeExtend($.zoeui.core.UIComponent, {
        __getType: function ()
        {
            return 'Panel';
        },
        __idPrev: function ()
        {
            return 'Panel';
        },
        _extendMethods: function ()
        {
            return $.zoeMethos.Panel;
        },
        _init: function ()
        {
            var g = this, p = this.options;
            $.zoeui.controls.Panel.base._init.call(this);
            p.content = p.content || $(g.element).html(); 
        },
        _render: function ()
        {
            var g = this, p = this.options; 
            g.panel = $(g.element).addClass("l-panel").html("");
            g.panel.append('<div class="l-panel-header"><span></span><div class="icons"></div></div><div class="l-panel-content"></div>');
             
            g.set(p);
 
            g.panel.bind("click.panel", function (e)
            { 
                var obj = (e.target || e.srcElement), jobj = $(obj);
                if (jobj.hasClass("l-panel-header-toggle"))
                {
                    g.toggle();
                } else if (jobj.hasClass("l-panel-header-close"))
                {
                    g.close();
                }
            });
        },
        _setChildren: function(children)
        {
            var g = this, p = this.options;
            var tagNames = {
                input : ["textbox", "combobox", "select"] 
            };
            var PluginNameMatchs  = 
            {
                "grid" : "zoeGrid",                
                "tree":"zoeTree",                
                "menu":"zoeMenu",
                "menubar":"zoeMenuBar",
                "portal":"zoePortal",
                "combobox":"zoeComboBox",
                "textbox":"zoeTextBox",
                "spinner":"zoeSpinner",
                "listbox":"zoeListBox",
                "checkbox":"zoeCheckBox",
                "radio":"zoeRadio",
                "checkboxlist":"zoeCheckBoxList",
                "radiolist":"zoeRadioList",                
                "button":"zoeButton",
                "dateeditor":"zoeDateEditor",
                "dialog":"zoeDialog",
                "panel":"zoePanel",
                "layout":"zoeLayout",
                "accordion":"zoeAccordion",
                "tab":"zoeTab" 
            }; 
            if (!children || !children.length) return;
            for (var i = 0; i < children.length; i++)
            {
                var child = children[i], type = child.type;
                var tagName = tagNames[type] || "div"; 
                var plugin = PluginNameMatchs[type];
                if (!plugin) continue;
                var element = document.createElement(tagName);
                g.panel.find(".l-panel-content").append(element);
                var childOp = $.extend({},child);
                childOp.type = null;
                $(element)[plugin](childOp);
            }
        },
        collapse: function ()
        {
            var g = this, p = this.options;
            var toggle = g.panel.find(".l-panel-header .l-panel-header-toggle:first");
            if (toggle.hasClass("l-panel-header-toggle-hide")) return;
            g.toggle();
        },
        expand: function ()
        {
            var g = this, p = this.options;
            var toggle = g.panel.find(".l-panel-header .l-panel-header-toggle:first");
            if (!toggle.hasClass("l-panel-header-toggle-hide")) return;
            g.toggle();
        },
        toggle : function()
        {
            var g = this, p = this.options;
            var toggle = g.panel.find(".l-panel-header .l-panel-header-toggle:first");
            if (toggle.hasClass("l-panel-header-toggle-hide"))
            {
                toggle.removeClass("l-panel-header-toggle-hide");
            } else
            {
                toggle.addClass("l-panel-header-toggle-hide");
            }
            g.panel.find(".l-panel-content:first").toggle("normal");
        },
        _setShowToggle:function(v)
        {
            var g = this, p = this.options;
            var header = g.panel.find(".l-panel-header:first");
            if (v)
            {
                var toggle = $("<div class='l-panel-header-toggle'></div>"); 
                toggle.appendTo(header.find(".icons")); 
            } else
            {
                header.find(".l-panel-header-toggle").remove();
            }
        },
        _setContent: function (v)
        {
            var g = this, p = this.options;
            var content = g.panel.find(".l-panel-content:first");
            if (v)
            {
                content.html(v);
            }
        },
        _setUrl: function (url)
        {
            var g = this, p = this.options;
            var content = g.panel.find(".l-panel-content:first");
            if (url)
            {
                g.jiframe = $("<iframe frameborder='0'></iframe>");
                var framename = p.frameName ? p.frameName : "zoepanel" + new Date().getTime();
                g.jiframe.attr("name", framename);
                g.jiframe.attr("id", framename);
                content.prepend(g.jiframe); 

                setTimeout(function ()
                {
                    if (content.find(".l-panel-loading:first").length == 0)
                        content.append("<div class='l-panel-loading' style='display:block;'></div>");
                    var iframeloading = $(".l-panel-loading:first", content);
                    g.jiframe[0].panel = g;//增加窗口对panel对象的引用
                    /*
                    可以在子窗口这样使用：
                    var panel = frameElement.panel;
                    var panelData = dialog.get('data');//获取data参数
                    panel.set('title','新标题'); //设置标题
                    panel.close();//关闭dialog 
                    */
                    g.jiframe.attr("src", p.url).bind('load.panel', function ()
                    {
                        iframeloading.hide();
                        g.trigger('loaded');
                    });
                    g.frame = window.frames[g.jiframe.attr("name")];
                }, 0); 
            }
        },
        _setShowClose: function (v)
        {
            var g = this, p = this.options;
            var header = g.panel.find(".l-panel-header:first");
            if (v)
            {
                var btn = $("<div class='l-panel-header-close'></div>"); 
                btn.appendTo(header.find(".icons"));
            } else
            {
                header.find(".l-panel-header-close").remove();
            }
        },
        close:function()
        {
            var g = this, p = this.options;
            if (g.trigger('close') == false) return;
            g.panel.remove();
            g.trigger('closed');
        }, 
        show: function ()
        {
            this.panel.show();
        },
        _setIcon : function(url)
        {
            var g = this;
            if (!url)
            {
                g.panel.removeClass("l-panel-hasicon");
                g.panel.find('img').remove();
            } else
            {
                g.panel.addClass("l-panel-hasicon");
                g.panel.append('<img src="' + url + '" />');
            }
        }, 
        _setWidth: function (value)
        { 
            value && this.panel.width(value);
        },
        _setHeight: function (value)
        { 
            var g = this, p = this.options;
            var header = g.panel.find(".l-panel-header:first");
            this.panel.find(".l-panel-content:first").height(value - header.height());
        },
        _setTitle: function (value)
        {
            this.panel.find(".l-panel-header span:first").text(value);
        } 
    }); 


})(jQuery);﻿/**
* jQuery zoeUI 1.0.0
* 
* zoePortal
* 
*/
(function ($)
{

    $.fn.zoePortal = function (options)
    {
        return $.zoeui.run.call(this, "zoePortal", arguments);
    };

    $.zoeDefaults.Portal = {
        width: null,
        /*行元素：组件允许以纵向方式分割为几块
        每一块(行)允许自定义N个列(column)
        每一列允许自定义N个Panel(最小元素)
        rows:[
            {columns:[ 
                {
                   width : '50%',
                   panels : [{width:'100%',content:'内容'},{width:'100%',url:@url1}]
                },{
                   width : '50%',
                   panels : [{width:'100%',url:@url2}]
                }
            ]}
        ]
        */
        rows: null,
        /* 列元素： 组件将认为只存在一个row(块),
       这一块 允许自定义N个列(column),结构同上
        */
        columns:null,
        url: null,          //portal结构定义URL   
        method: 'get',                         //获取数据http方式
        parms: null,                         //提交到服务器的参数
        draggable: false,   //是否允许拖拽
        onLoaded:null       //url模式 加载完事件
    };
    $.zoeDefaults.Portal_rows = {
        width: null,
        height: null 
    };
    $.zoeDefaults.Portal_columns = {
        width: null,
        height: null 
    };

    $.zoeMethos.Portal = {};

 

    $.zoeui.controls.Portal = function (element, options)
    {
        $.zoeui.controls.Portal.base.constructor.call(this, element, options);
    };
    $.zoeui.controls.Portal.zoeExtend($.zoeui.core.UIComponent, {
        __getType: function ()
        {
            return 'Portal';
        },
        __idPrev: function ()
        {
            return 'Portal';
        },
        _extendMethods: function ()
        {
            return $.zoeMethos.Portal;
        },
        _init: function ()
        {
            var g = this, p = this.options;
            $.zoeui.controls.Portal.base._init.call(this); 
            if ($(">div", g.element).length) //如果已经定义了DIV子元素,那么这些元素将会转换为columns,这里暂时保存到tempInitPanels
            { 
                p.columns = [];
                $(">div", g.element).each(function (i, jpanel)
                {
                    p.columns[i] = {
                        panels :[]
                    };
                });

                g.tempInitPanels = $("<div></div>");
                $(">div", g.element).appendTo(g.tempInitPanels); 
            }
            if (!p.rows && p.columns)
            {
                p.rows = [{
                    columns: p.columns
                }];
            }
        },
        _render: function ()
        {
            var g = this, p = this.options;
            
            g.portal = $(g.element).addClass("l-portal").html(""); 
             
            g.set(p);
             
        }, 
        _setRows: function (rows)
        {
            var g = this, p = this.options;
            g.rows = [];
            if (rows && rows.length)
            {
                for (var i = 0; i < rows.length; i++)
                { 
                    var row = rows[i];
                    var jrow = $('<div class="l-row"></div>').appendTo(g.portal); 
                    g.rows[i] = g._renderRow({
                        row: row,
                        rowIndex: i,
                        jrow: jrow
                    });
                    jrow.append('<div class="l-clear"></div>');
                }
            }
        },
        _renderRow : function(e)
        {
            var row = e.row, rowIndex = e.rowIndex, jrow = e.jrow;
            var g = this, p = this.options;
            var rowObj = {
                element : jrow[0]
            };
            if (row.width) jrow.width(row.width);
            if (row.height) jrow.height(row.height);
            if (row.columns) rowObj.columns = [];
            if (row.columns && row.columns.length)
            {  
                for (var i = 0; i < row.columns.length; i++)
                {
                    var column = row.columns[i];
                    var jcolumn = $('<div class="l-column"></div>').appendTo(jrow);
                    rowObj.columns[i] = g._renderColumn({
                        column: column,
                        columnIndex: i,
                        jcolumn: jcolumn,
                        rowIndex : rowIndex
                    });  
                }
            }
            return rowObj;
        },
        remove: function (e)
        {
            var g = this, p = this.options;
            var rowIndex = e.rowIndex, columnIndex = e.columnIndex, index = e.index;
            if (index == null) index = -1; 
            if (index >= 0 && g.rows[rowIndex] && g.rows[rowIndex].columns && g.rows[rowIndex].columns[columnIndex] && g.rows[rowIndex].columns[columnIndex].panels)
            {
                var panel = g.rows[rowIndex].columns[columnIndex].panels[index]; 
                panel && panel.close();
                g._updatePortal();
            }  
        },
        add: function (e)
        {
            var g = this, p = this.options;
            var rowIndex = e.rowIndex, columnIndex = e.columnIndex, index = e.index, panel = e.panel;
            if (index == null) index = -1;
            if (!(g.rows[rowIndex] && g.rows[rowIndex].columns && g.rows[rowIndex].columns[columnIndex])) return;
            var gColumn = g.rows[rowIndex].columns[columnIndex], pColumn = p.rows[rowIndex].columns[columnIndex], zoePanel, jcolumn = $(gColumn.element);
            pColumn.panels = pColumn.panels || [];
            gColumn.panels = gColumn.panels || [];
            pColumn.panels.splice(index, 0, panel); 
            if (index < 0)
            { 
                var jpanel = $('<div></div>').insertBefore(gColumn.jplace);
                zoePanel = jpanel.zoePanel(panel); 
            } else if(gColumn.panels[index])
            {
                var jpanel = $('<div></div>').insertBefore(gColumn.panels[index].panel);
                zoePanel = jpanel.zoePanel(panel);
            }
            if (zoePanel)
            {
                zoePanel.bind('closed', g._createPanelClosed());
                g.setPanelEvent({
                    panel: zoePanel
                });
                gColumn.panels.splice(index, 0, zoePanel);
            }
            g._updatePortal();
        },
        _createPanelClosed : function ()
        {
            var g = this, p = this.options;
            return function ()
            {
                var panel = this;//zoePanel对象
                var panels = g.getPanels();
                var rowIndex, columnIndex, index;
                $(panels).each(function ()
                {
                    if (this.panel == panel)
                    {
                        rowIndex = this.rowIndex;
                        columnIndex = this.columnIndex;
                        index = this.index;
                    }
                });
                p.rows[rowIndex].columns[columnIndex].panels.splice(index, 1);
                g.rows[rowIndex].columns[columnIndex].panels.splice(index, 1);
            };
        },
        _renderColumn: function (e)
        {
            var column = e.column, columnIndex = e.columnIndex, jcolumn = e.jcolumn;
            var rowIndex = e.rowIndex;
            var g = this, p = this.options;
            var columnObj = {
                element : jcolumn[0]
            };
            if (column.width) jcolumn.width(column.width);
            if (column.height) jcolumn.height(column.height);
            if (column.panels) columnObj.panels = [];
            if (column.panels && column.panels.length)
            {
                for (var i = 0; i < column.panels.length; i++)
                {
                    var panel = column.panels[i]; 
                    var jpanel = $('<div></div>').appendTo(jcolumn);
                    columnObj.panels[i] = jpanel.zoePanel(panel);
                    columnObj.panels[i].bind('closed', g._createPanelClosed());
                    g.setPanelEvent({ 
                        panel: columnObj.panels[i]
                    });
                }
            } else if(g.tempInitPanels)
            {
              
                var tempPanel = g.tempInitPanels.find(">div:eq(" + columnIndex + ")");
                if (tempPanel.length)
                {
                    columnObj.panels = [];
                    var panelOptions = {};
                    var jelement = tempPanel.clone();
                    if (zoe.inject && zoe.inject.getOptions)
                    {
                        panelOptions = zoe.inject.getOptions({
                            jelement: jelement,
                            defaults: $.zoeDefaults.Panel,
                            config: zoe.inject.config.Panel
                        });
                    }
                    columnObj.panels[0] = jelement.appendTo(jcolumn).zoePanel(panelOptions);
                    columnObj.panels[0].bind('closed', g._createPanelClosed());
                    g.setPanelEvent({ 
                        panel: columnObj.panels[0]
                    });
                } 
            }
            columnObj.jplace = $('<div class="l-column-place"></div>').appendTo(jcolumn);
            return columnObj; 
        },
        setPanelEvent: function(e)
        {  
            //panel:zoeui对象,jpanel:jQuery dom对象
            var panel = e.panel, jpanel = panel.panel;
            var g = this, p = this.options;
            //拖拽支持
            if ($.fn.zoeDrag && p.draggable)
            { 
                jpanel.addClass("l-panel-draggable").zoeDrag({
                    proxy: false, revert: true,
                    handler: ".l-panel-header span:first",
                    onRendered: function ()
                    { 
                    },
                    onStartDrag: function (current, e)
                    {
                        g.portal.find(">.l-row").addClass("l-row-dragging");
                        this.jplace = $('<div class="l-panel-place"></div>');
                        this.jplace.height(jpanel.height());
                        jpanel.width(jpanel.width());
                        jpanel.addClass("l-panel-dragging"); 
                        jpanel.css("position", "absolute"); 
                        jpanel.after(this.jplace); 
                        g._updatePortal();
                    },
                    onDrag: function (current, e)
                    {
                        var pageX = e.pageX || e.screenX, pageY = e.pageY || e.screenY;
                        var height = jpanel.height(), width = jpanel.width(), offset = jpanel.offset();
                        var centerX = offset.left + width / 2, centerY = offset.top + 10; 
                        var panels = g.getPanels(), emptyColumns = g.getEmptyColumns();
                        var result = getPositionIn(panels, emptyColumns, centerX, centerY);
                        if (result)
                        { 
                            //判断是否跟上次匹配的位置一致
                            if (this.placeStatus)
                            {
                                if (this.placeStatus.panel && result.panel)
                                {
                                    if (this.placeStatus.panel.rowIndex == result.panel.rowIndex &&
                                this.placeStatus.panel.columnIndex == result.panel.columnIndex &&
                                this.placeStatus.panel.index == result.panel.index &&
                                this.placeStatus.position == result.position)
                                    {
                                        return;
                                    }
                                }
                                if (this.placeStatus.column && result.column) //定位到空元素行
                                {
                                    if (this.placeStatus.column.rowIndex == result.column.rowIndex && this.placeStatus.column.columnIndex == result.column.columnIndex && this.placeStatus.position == result.position)
                                    {
                                        return;
                                    }
                                }
                            }
                            if (result.position == "top")
                            { 
                                this.jplace.insertBefore(result.panel ? result.panel.jpanel : result.column.jplace);
                                this.savedPosition = result.panel ? result.panel : result.column
                                this.savedPosition.inTop = true;
                            } else if (result.position == "bottom")
                            {
                                this.jplace.insertAfter(result.panel.jpanel);
                                this.savedPosition = result.panel;
                                this.savedPosition.inTop = false;
                            }
                            this.placeStatus = result; 
                        } 
                        else//没有匹配到
                        {
                            this.placeStatus = null; 
                        }

                        //从指定的元素集合匹配位置
                        function getPositionIn(panels, columns, x, y)
                        {
                            for (i = 0, l = panels.length; i < l; i++)
                            {
                                var o = panels[i];
                                if (o.panel == panel) //如果是本身
                                {
                                    continue;
                                }
                                var r = positionIn(o, null, x, y);
                                if (r) return r;
                            }
                            for (i = 0, l = columns.length; i < l; i++)
                            {
                                var column = columns[i];
                                var r = positionIn(null, column, x, y);
                                if (r) return r;
                            }
                            return null;
                        }
                        //坐标在目标区域范围内 x,y为panel标题栏中间的位置
                        function positionIn(panel, column, x, y)
                        {
                            var jelement = panel ? panel.jpanel : column.jplace;
                            if (!jelement) return null;
                            var height = jelement.height(), width = jelement.width();
                            var left = jelement.offset().left, top = jelement.offset().top;
                            var diff = 3;
                            if (x > left - diff && x < left + width + diff)
                            {
                                if (y > top - diff && y < top + height / 2 + diff)
                                {
                                    return {
                                        panel: panel,
                                        column: column,
                                        position: "top"
                                    };
                                }
                                if (y > top + height / 2 - diff && y < top + height + diff)
                                {
                                    return {
                                        panel: panel,
                                        column: column,
                                        position: panel ? "bottom" : "top"
                                    };
                                }
                            }
                            return null;
                        }
                    },
                    onStopDrag: function (current, e)
                    {
                        g.portal.find(">.l-row").removeClass("l-row-dragging");
                        panel.set('width', panel.get('width')); 
                        jpanel.removeClass("l-panel-dragging");
                        //将jpanel替换到jplace的位置 
                        if (this.jplace)
                        {
                            jpanel.css({
                                "position": "relative",
                                "left": null,
                                "top": null
                            });
                            jpanel.insertAfter(this.jplace); 
                            g.portal.find(">.l-row > .l-column >.l-panel-place").remove();

                            if (this.savedPosition)
                            {
                                var panels = g.getPanels();
                                var rowIndex, columnIndex, index;
                                $(panels).each(function ()
                                {
                                    if (this.panel == panel)
                                    {
                                        rowIndex = this.rowIndex;
                                        columnIndex = this.columnIndex;
                                        index = this.index;
                                    }
                                });
                                var oldPanelOptions = p.rows[rowIndex].columns[columnIndex].panels[index];
                                var oldPanel = g.rows[rowIndex].columns[columnIndex].panels[index];
                                p.rows[rowIndex].columns[columnIndex].panels.splice(index, 1);
                                g.rows[rowIndex].columns[columnIndex].panels.splice(index, 1);

                                if (this.savedPosition.panel)
                                { 
                                  
                                    p.rows[this.savedPosition.rowIndex].columns[this.savedPosition.columnIndex].panels.splice(this.savedPosition.index + this.savedPosition.inTop ? -1 : 0, 0, oldPanelOptions); 
                                    g.rows[this.savedPosition.rowIndex].columns[this.savedPosition.columnIndex].panels.splice(this.savedPosition.index + this.savedPosition.inTop ? -1 : 0, 0, oldPanel);
                                } else
                                {
                                    p.rows[this.savedPosition.rowIndex].columns[this.savedPosition.columnIndex].panels = [oldPanelOptions];
                                    g.rows[this.savedPosition.rowIndex].columns[this.savedPosition.columnIndex].panels = [oldPanel];
                                } 
                            }
                        }
                        g._updatePortal();
                       
                        return false;
                    }
                });
            }
         
        },
        _updatePortal:function()
        {
            var g = this, p = this.options;
            $(g.rows).each(function (rowIndex)
            {
                $(this.columns).each(function (columnIndex)
                {
                    if (this.panels && this.panels.length)
                    {
                        $(this.element).removeClass("l-column-empty");
                    } else
                    {
                        $(this.element).addClass("l-column-empty");
                    }
                });
            });
        },
        getPanels : function ()
        {
            var g = this, p = this.options;
            var panels = []; 
            $(g.rows).each(function (rowIndex)
            { 
                $(this.columns).each(function (columnIndex)
                { 
                    $(this.panels).each(function (index)
                    {
                        panels.push({
                            rowIndex: rowIndex,
                            columnIndex: columnIndex,
                            index: index,
                            panel : this,
                            jpanel : this.panel
                        });
                    }); 
                }); 
            }); 
            return panels;
        },
        getPanel: function (e)
        {
            var g = this, p = this.options;
            e = $.extend({
                rowIndex: 0,
                columnIndex: 0,
                index : 0
            }, e);
            var panel = null;
            $(g.rows).each(function (rowIndex)
            {
                $(this.columns).each(function (columnIndex)
                {
                    $(this.panels).each(function (index)
                    {
                        if (panel) return;
                        if (rowIndex == e.rowIndex && columnIndex == e.columnIndex && index == e.index)
                        {
                            panel = this;
                        } 
                    });
                });
            });
            return panel;
        },
        getEmptyColumns:function(){
            var g = this, p = this.options;
            var columns = [];
            $(g.rows).each(function (rowIndex)
            { 
                $(this.columns).each(function (columnIndex)
                {
                    if (!this.panels || !this.panels.length)
                    {
                        columns.push({
                            rowIndex: rowIndex,
                            columnIndex: columnIndex, 
                            jplace : this.jplace
                        });
                    }
                }); 
            });
            return columns;
        },
        _setUrl: function (url)
        {
            var g = this, p = this.options;
            if (!url) return;
            $.ajax({
                url: url, data: p.parms, type: p.method, dataType: 'json',
                success: function (rows)
                {
                    g.set('rows', rows);
                }
            });
        },  
        _setWidth: function (value)
        { 
            value && this.portal.width(value);
        },
        collapseAll: function ()
        {
            var g = this, p = this.options;
            var panels = g.getPanels();
            $(panels).each(function (i,o)
            {
                var panel = o.panel; 
                panel.collapse();
            });
        },
        expandAll: function ()
        {
            var g = this, p = this.options;
            var panels = g.getPanels();
            $(panels).each(function (i, o)
            {
                var panel = o.panel;
                panel.expand();
            });
        }
    }); 


})(jQuery);﻿/**
* jQuery zoeUI 1.0.0
* 
*zoeRadio
* 
*/

(function ($)
{

    $.fn.zoeRadio = function ()
    {
        return $.zoeui.run.call(this, "zoeRadio", arguments);
    };

    $.fn.zoeGetRadioManager = function ()
    {
        return $.zoeui.run.call(this, "zoeGetRadioManager", arguments);
    };

    $.zoeDefaults.Radio = { disabled: false };

    $.zoeMethos.Radio = {};

    $.zoeui.controls.Radio = function (element, options)
    {
        $.zoeui.controls.Radio.base.constructor.call(this, element, options);
    };
    $.zoeui.controls.Radio.zoeExtend($.zoeui.controls.Input, {
        __getType: function ()
        {
            return 'Radio';
        },
        __idPrev: function ()
        {
            return 'Radio';
        },
        _extendMethods: function ()
        {
            return $.zoeMethos.Radio;
        },
        _render: function ()
        {
            var g = this, p = this.options;
            g.input = $(this.element);
            g.link = $('<a href="javascript:void(0)" class="l-radio"></a>');
            g.wrapper = g.input.addClass('l-hidden').wrap('<div class="l-radio-wrapper"></div>').parent();
            g.wrapper.prepend(g.link);
            g.input.change(function ()
            {
                if (this.checked)
                {
                    g.link.addClass('l-radio-checked');
                }
                else
                {
                    g.link.removeClass('l-radio-checked');
                }
                return true;
            });
            g.link.click(function ()
            {
                g._doclick();
            });
            g.wrapper.hover(function ()
            {
                if (!p.disabled)
                    $(this).addClass("l-over");
            }, function ()
            {
                $(this).removeClass("l-over");
            });
            this.element.checked && g.link.addClass('l-radio-checked');

            if (this.element.id)
            {
                $("label[for=" + this.element.id + "]").click(function ()
                {
                    g._doclick();
                });
            }
            g.set(p);
        },
        setValue: function (value)
        {
            var g = this, p = this.options;
            if (!value)
            {
                g.input[0].checked = false;
                g.link.removeClass('l-radio-checked');
            }
            else
            {
                g.input[0].checked = true;
                g.link.addClass('l-radio-checked');
            }
        },
        getValue: function ()
        {
            return this.input[0].checked;
        },
        setEnabled: function ()
        {
            this.input.attr('disabled', false);
            this.wrapper.removeClass("l-disabled");
            this.options.disabled = false;
        },
        setDisabled: function ()
        {
            this.input.attr('disabled', true);
            this.wrapper.addClass("l-disabled");
            this.options.disabled = true;
        },
        updateStyle: function ()
        {
            if (this.input.attr('disabled'))
            {
                this.wrapper.addClass("l-disabled");
                this.options.disabled = true;
            }
            if (this.input[0].checked)
            {
                this.link.addClass('l-checkbox-checked');
            }
            else
            {
                this.link.removeClass('l-checkbox-checked');
            }
        },
        _doclick: function ()
        {
            var g = this, p = this.options;
            if (g.input.attr('disabled')) { return false; }
            g.input.trigger('click').trigger('change');
            var formEle;
            if (g.input[0].form) formEle = g.input[0].form;
            else formEle = document;
            $("input:radio[name=" + g.input[0].name + "]", formEle).not(g.input).trigger("change");
            return false;
        }
    });


})(jQuery);﻿/**
* jQuery zoeUI 1.0.0
* 
* zoeRadioList
* 
*/
(function ($)
{

    $.fn.zoeRadioList = function (options)
    {
        return $.zoeui.run.call(this, "zoeRadioList", arguments);
    };
    $.fn.zoeGetRadioListManager = function ()
    {
        return $.zoeui.run.call(this, "zoeGetRadioListManager", arguments);
    };

    $.zoeDefaults.RadioList = {
        rowSize: 3,            //每行显示元素数   
        valueField: 'id',       //值成员
        textField: 'text',      //显示成员 
        valueFieldID: null,      //隐藏域
        name: null,            //表单名 
        data: null,             //数据  
        parms: null,            //ajax提交表单 
        url: null,              //数据源URL(需返回JSON)
        onSuccess: null,
        onError: null,
        onSelect: null,
        css: null,               //附加css  
        value: null,            //值 
        valueFieldCssClass: null
    };

    //扩展方法
    $.zoeMethos.RadioList = $.zoeMethos.RadioList || {};


    $.zoeui.controls.RadioList = function (element, options)
    {
        $.zoeui.controls.RadioList.base.constructor.call(this, element, options);
    };
    $.zoeui.controls.RadioList.zoeExtend($.zoeui.controls.Input, {
        __getType: function ()
        {
            return 'RadioList';
        },
        _extendMethods: function ()
        {
            return $.zoeMethos.RadioList;
        },
        _init: function ()
        {
            $.zoeui.controls.RadioList.base._init.call(this);
        },
        _render: function ()
        {
            var g = this, p = this.options;
            g.data = p.data;
            g.valueField = null; //隐藏域(保存值) 

            if (p.valueFieldID)
            {
                g.valueField = $("#" + p.valueFieldID + ":input,[name=" + p.valueFieldID + "]:input");
                if (g.valueField.length == 0) g.valueField = $('<input type="hidden"/>');
                g.valueField[0].id = g.valueField[0].name = p.valueFieldID;
            }
            else
            {
                g.valueField = $('<input type="hidden"/>');
                g.valueField[0].id = g.valueField[0].name = g.id + "_val";
            }
            if (g.valueField[0].name == null) g.valueField[0].name = g.valueField[0].id;
            if (p.valueFieldCssClass)
            {
                g.valueField.addClass(p.valueFieldCssClass);
            }
            g.valueField.attr("data-zoeid", g.id);
            g.radioList = $(this.element);
            g.radioList.html('<div class="l-radiolist-inner"><table cellpadding="0" cellspacing="0" border="0" class="l-radiolist-table"></table></div>').addClass("l-radiolist").append(g.valueField);
            g.radioList.table = $("table:first", g.radioList);


            p.value = g.valueField.val() || p.value;

            g.set(p);

            g._addClickEven();
        },
        destroy: function ()
        {
            if (this.radioList) this.radioList.remove();
            this.options = null;
            $.zoeui.remove(this);
        },
        clear: function ()
        {
            this._changeValue("");
            this.trigger('clear');
        },
        _setCss: function (css)
        {
            if (css)
            {
                this.radioList.addClass(css);
            }
        },
        _setDisabled: function (value)
        {
            //禁用样式
            if (value)
            {
                this.radioList.addClass('l-radiolist-disabled');
                $("input:radio", this.radioList).attr("disabled", true);
            } else
            {
                this.radioList.removeClass('l-radiolist-disabled');
                $("input:radio", this.radioList).removeAttr("disabled");
            }
        },
        _setWidth: function (value)
        {
            this.radioList.width(value);
        },
        _setHeight: function (value)
        {
            this.radioList.height(value);
        },
        indexOf: function (item)
        {
            var g = this, p = this.options;
            if (!g.data) return -1;
            for (var i = 0, l = g.data.length; i < l; i++)
            {
                if (typeof (item) == "object")
                {
                    if (g.data[i] == item) return i;
                } else
                {
                    if (g.data[i][p.valueField].toString() == item.toString()) return i;
                }
            }
            return -1;
        },
        removeItems: function (items)
        {
            var g = this;
            if (!g.data) return;
            $(items).each(function (i, item)
            {
                var index = g.indexOf(item);
                if (index == -1) return;
                g.data.splice(index, 1);
            });
            g.refresh();
        },
        removeItem: function (item)
        {
            if (!this.data) return;
            var index = this.indexOf(item);
            if (index == -1) return;
            this.data.splice(index, 1);
            this.refresh();
        },
        insertItem: function (item, index)
        {
            var g = this;
            if (!g.data) g.data = [];
            g.data.splice(index, 0, item);
            g.refresh();
        },
        addItems: function (items)
        {
            var g = this;
            if (!g.data) g.data = [];
            $(items).each(function (i, item)
            {
                g.data.push(item);
            });
            g.refresh();
        },
        addItem: function (item)
        {
            var g = this;
            if (!g.data) g.data = [];
            g.data.push(item);
            g.refresh();
        },
        _setValue: function (value)
        {
            var g = this, p = this.options;
            p.value = value;
            this._dataInit();
        },
        setValue: function (value)
        {
            this._setValue(value);
        },
        _setUrl: function (url)
        {
            if (!url) return;
            var g = this, p = this.options;
            $.ajax({
                type: 'post',
                url: url,
                data: p.parms,
                cache: false,
                dataType: 'json',
                success: function (data)
                {
                    g.setData(data);
                    g.trigger('success', [data]);
                },
                error: function (XMLHttpRequest, textStatus)
                {
                    g.trigger('error', [XMLHttpRequest, textStatus]);
                }
            });
        },
        setUrl: function (url)
        {
            return this._setUrl(url);
        },
        setParm: function (name, value)
        {
            if (!name) return;
            var g = this;
            var parms = g.get('parms');
            if (!parms) parms = {};
            parms[name] = value;
            g.set('parms', parms);
        },
        clearContent: function ()
        {
            var g = this, p = this.options;
            $("table", g.radioList).html("");
        },
        _setData: function (data)
        {
            this.setData(data);
        },
        setData: function (data)
        {
            var g = this, p = this.options;
            if (!data || !data.length) return;
            g.data = data;
            g.refresh();
            g.updateStyle();
        },
        refresh: function ()
        {
            var g = this, p = this.options, data = this.data;
            this.clearContent();
            if (!data) return;
            var out = [], rowSize = p.rowSize, appendRowStart = false, name = p.name || g.id;
            for (var i = 0; i < data.length; i++)
            {
                var val = data[i][p.valueField], txt = data[i][p.textField], id = g.id + "-" + i;
                var newRow = i % rowSize == 0;
                //0,5,10
                if (newRow)
                {
                    if (appendRowStart) out.push('</tr>');
                    out.push("<tr>");
                    appendRowStart = true;
                }
                out.push("<td><input type='radio' name='" + name + "' value='" + val + "' id='" + id + "'/><label for='" + id + "'>" + txt + "</label></td>");
            }
            if (appendRowStart) out.push('</tr>');
            g.radioList.table.append(out.join(''));
        },
        _getValue: function ()
        {
            var g = this, p = this.options, name = p.name || g.id;
            return $('input:radio[name="' + name + '"]:checked').val();
        },
        getValue: function ()
        {
            //获取值
            return this._getValue();
        },
        updateStyle: function ()
        {
            var g = this, p = this.options;
            g._dataInit();
            $(":radio", g.element).change(function ()
            {
                var value = g.getValue();
                g.trigger('select', [{
                    value: value
                }]);
            });
        },
        _dataInit: function ()
        {
            var g = this, p = this.options;
            var value = g.valueField.val() || g._getValue() || p.value;
            g._changeValue(value);
        },
        //设置值到 隐藏域
        _changeValue: function (newValue)
        {
            var g = this, p = this.options, name = p.name || g.id;
            $("input:radio[name='" + name + "']", g.radioList).each(function ()
            {
                this.checked = this.value == newValue;
            });
            g.valueField.val(newValue);
            g.selectedValue = newValue;
        },
        _addClickEven: function ()
        {
            var g = this, p = this.options;
            //选项点击
            g.radioList.click(function (e)
            {
                var value = g.getValue();
                if (value) g.valueField.val(value);
            });
        }
    });


})(jQuery);/**
* jQuery zoeUI 1.0.0
* 
* 
*  
* 
* 
*/
(function ($)
{
    $.fn.zoeResizable = function (options)
    {
        return $.zoeui.run.call(this, "zoeResizable", arguments,
        {
            idAttrName: 'zoeuiresizableid', hasElement: false, propertyToElemnt: 'target'
        });
    };

    $.fn.zoeGetResizableManager = function ()
    {
        return $.zoeui.run.call(this, "zoeGetResizableManager", arguments,
        {
            idAttrName: 'zoeuiresizableid', hasElement: false, propertyToElemnt: 'target'
        });
    };


    $.zoeDefaults.Resizable = {
        handles: 'n, e, s, w, ne, se, sw, nw',
        maxWidth: 2000,
        maxHeight: 2000,
        minWidth: 20,
        minHeight: 20,
        scope: 3,
        animate: false,
        onStartResize: function (e) { },
        onResize: function (e) { },
        onStopResize: function (e) { },
        onEndResize: null
    };

    $.zoeui.controls.Resizable = function (options)
    {
        $.zoeui.controls.Resizable.base.constructor.call(this, null, options);
    };

    $.zoeui.controls.Resizable.zoeExtend($.zoeui.core.UIComponent, {
        __getType: function ()
        {
            return 'Resizable';
        },
        __idPrev: function ()
        {
            return 'Resizable';
        },
        _render: function ()
        {
            var g = this, p = this.options;
            g.target = $(p.target);
            g.set(p);

            g.target.mousemove(function (e)
            {
                if (p.disabled) return;
                g.dir = g._getDir(e);
                if (g.dir)
                    g.target.css('cursor', g.dir + '-resize');
                else if (g.target.css('cursor').indexOf('-resize') > 0)
                    g.target.css('cursor', 'default');
                if (p.target.zoeuidragid)
                {
                    var drag = $.zoeui.get(p.target.zoeuidragid);
                    if (drag && g.dir)
                    {
                        drag.set('disabled', true);
                    } else if (drag)
                    {
                        drag.set('disabled', false);
                    }
                }
            }).mousedown(function (e)
            {
                if (p.disabled) return;
                if (g.dir)
                {
                    g._start(e);
                }
            });
        },
        _rendered: function ()
        {
            this.options.target.zoeuiresizableid = this.id;
        },
        _getDir: function (e)
        {
            var g = this, p = this.options;
            var dir = '';
            var xy = g.target.offset();
            var width = g.target.width();
            var height = g.target.height();
            var scope = p.scope;
            var pageX = e.pageX || e.screenX;
            var pageY = e.pageY || e.screenY;
            if (pageY >= xy.top && pageY < xy.top + scope)
            {
                dir += 'n';
            }
            else if (pageY <= xy.top + height && pageY > xy.top + height - scope)
            {
                dir += 's';
            }
            if (pageX >= xy.left && pageX < xy.left + scope)
            {
                dir += 'w';
            }
            else if (pageX <= xy.left + width && pageX > xy.left + width - scope)
            {
                dir += 'e';
            }
            if (p.handles == "all" || dir == "") return dir;
            if ($.inArray(dir, g.handles) != -1) return dir;
            return '';
        },
        _setHandles: function (handles)
        {
            if (!handles) return;
            this.handles = handles.replace(/(\s*)/g, '').split(',');
        },
        _createProxy: function ()
        {
            var g = this;
            g.proxy = $('<div class="l-resizable"></div>');
            g.proxy.width(g.target.width()).height(g.target.height())
            g.proxy.attr("resizableid", g.id).appendTo('body');
        },
        _removeProxy: function ()
        {
            var g = this;
            if (g.proxy)
            {
                g.proxy.remove();
                g.proxy = null;
            }
        },
        _start: function (e)
        {
            var g = this, p = this.options;
            g._createProxy();
            g.proxy.css({
                left: g.target.offset().left,
                top: g.target.offset().top,
                position: 'absolute'
            });
            g.current = {
                dir: g.dir,
                left: g.target.offset().left,
                top: g.target.offset().top,
                startX: e.pageX || e.screenX,
                startY: e.pageY || e.clientY,
                width: g.target.width(),
                height: g.target.height()
            };
            $(document).bind("selectstart.resizable", function () { return false; });
            $(document).bind('mouseup.resizable', function ()
            {
                g._stop.apply(g, arguments);
            });
            $(document).bind('mousemove.resizable', function ()
            {
                g._drag.apply(g, arguments);
            });
            g.proxy.show();
            g.trigger('startResize', [g.current, e]);
        },
        changeBy: {
            t: ['n', 'ne', 'nw'],
            l: ['w', 'sw', 'nw'],
            w: ['w', 'sw', 'nw', 'e', 'ne', 'se'],
            h: ['n', 'ne', 'nw', 's', 'se', 'sw']
        },
        _drag: function (e)
        {
            var g = this, p = this.options;
            if (!g.current) return;
            if (!g.proxy) return;
            g.proxy.css('cursor', g.current.dir == '' ? 'default' : g.current.dir + '-resize');
            var pageX = e.pageX || e.screenX;
            var pageY = e.pageY || e.screenY;
            g.current.diffX = pageX - g.current.startX;
            g.current.diffY = pageY - g.current.startY;
            g._applyResize(g.proxy);
            g.trigger('resize', [g.current, e]);
        },
        _stop: function (e)
        {
            var g = this, p = this.options; 
            if (g.hasBind('stopResize'))
            {
                if (g.trigger('stopResize', [g.current, e]) != false)
                    g._applyResize();
            }
            else
            {
                g._applyResize();
            }
            g._removeProxy();
            g.trigger('endResize', [g.current, e]);
            $(document).unbind("selectstart.resizable");
            $(document).unbind('mousemove.resizable');
            $(document).unbind('mouseup.resizable');
        },
        _applyResize: function (applyResultBody)
        {
            var g = this, p = this.options;
            var cur = {
                left: g.current.left,
                top: g.current.top,
                width: g.current.width,
                height: g.current.height
            };
            var applyToTarget = false;
            if (!applyResultBody)
            {
                applyResultBody = g.target;
                applyToTarget = true;
                if (!isNaN(parseInt(g.target.css('top'))))
                    cur.top = parseInt(g.target.css('top'));
                else
                    cur.top = 0;
                if (!isNaN(parseInt(g.target.css('left'))))
                    cur.left = parseInt(g.target.css('left'));
                else
                    cur.left = 0;
            }
            if ($.inArray(g.current.dir, g.changeBy.l) > -1)
            {
                cur.left += g.current.diffX;
                g.current.diffLeft = g.current.diffX;

            }
            else if (applyToTarget)
            {
                delete cur.left;
            }
            if ($.inArray(g.current.dir, g.changeBy.t) > -1)
            {
                cur.top += g.current.diffY;
                g.current.diffTop = g.current.diffY;
            }
            else if (applyToTarget)
            {
                delete cur.top;
            }
            if ($.inArray(g.current.dir, g.changeBy.w) > -1)
            {
                cur.width += (g.current.dir.indexOf('w') == -1 ? 1 : -1) * g.current.diffX;
                g.current.newWidth = cur.width;
            }
            else if (applyToTarget)
            {
                delete cur.width;
            }
            if ($.inArray(g.current.dir, g.changeBy.h) > -1)
            {
                cur.height += (g.current.dir.indexOf('n') == -1 ? 1 : -1) * g.current.diffY;
                g.current.newHeight = cur.height;
            }
            else if (applyToTarget)
            {
                delete cur.height;
            }
            if (applyToTarget && p.animate)
                applyResultBody.animate(cur);
            else
                applyResultBody.css(cur);
        }
    });



})(jQuery);﻿/**
* jQuery zoeUI 1.0.0
* 
* 
*  
* 
* 
*/
(function ($)
{
    $.fn.zoeSpinner = function ()
    {
        return $.zoeui.run.call(this, "zoeSpinner", arguments);
    };
    $.fn.zoeGetSpinnerManager = function ()
    {
        return $.zoeui.run.call(this, "zoeGetSpinnerManager", arguments);
    };

    $.zoeDefaults.Spinner = {
        type: 'float',     //类型 float:浮点数 int:整数 time:时间
        isNegative: true, //是否负数
        decimalplace: 2,   //小数位 type=float时起作用
        step: 0.1,         //每次增加的值
        interval: 50,      //间隔，毫秒
        onChangeValue: false,    //改变值事件
        minValue: null,        //最小值
        maxValue: null,         //最大值
        disabled: false,
        readonly: false              //是否只读
    };

    $.zoeMethos.Spinner = {};

    $.zoeui.controls.Spinner = function (element, options)
    {
        $.zoeui.controls.Spinner.base.constructor.call(this, element, options);
    };
    $.zoeui.controls.Spinner.zoeExtend($.zoeui.controls.Input, {
        __getType: function ()
        {
            return 'Spinner';
        },
        __idPrev: function ()
        {
            return 'Spinner';
        },
        _extendMethods: function ()
        {
            return $.zoeMethos.Spinner;
        },
        _init: function ()
        {
            $.zoeui.controls.Spinner.base._init.call(this);
            var p = this.options;
            if (p.type == 'float')
            {
                p.step = 0.1;
                p.interval = 50;
            } else if (p.type == 'int')
            {
                p.step = 1;
                p.interval = 100;
            } else if (p.type == 'time')
            {
                p.step = 1;
                p.interval = 100;
            } else
            {
                p.type = "int";
                p.step = 1;
                p.interval = 100;
            }
        },
        _render: function ()
        {
            var g = this, p = this.options;
            g.interval = null;
            g.inputText = null;
            g.value = null;
            g.textFieldID = "";
            if (this.element.tagName.toLowerCase() == "input" && this.element.type && this.element.type == "text")
            {
                g.inputText = $(this.element);
                if (this.element.id)
                    g.textFieldID = this.element.id;
            }
            else
            {
                g.inputText = $('<input type="text"/>');
                g.inputText.appendTo($(this.element));
            }
            if (g.textFieldID == "" && p.textFieldID)
                g.textFieldID = p.textFieldID;

            g.link = $('<div class="l-trigger"><div class="l-spinner-up"><div class="l-spinner-icon"></div></div><div class="l-spinner-split"></div><div class="l-spinner-down"><div class="l-spinner-icon"></div></div></div>');
            g.wrapper = g.inputText.wrap('<div class="l-text"></div>').parent();
            g.wrapper.append('<div class="l-text-l"></div><div class="l-text-r"></div>');
            g.wrapper.append(g.link).after(g.selectBox).after(g.valueField);
            g.link.up = $(".l-spinner-up", g.link);
            g.link.down = $(".l-spinner-down", g.link);
            g.inputText.addClass("l-text-field");

            if (p.disabled)
            {
                g.wrapper.addClass("l-text-disabled");
            }
            //初始化
            if (!g._isVerify(g.inputText.val()))
            {
                g.value = g._getDefaultValue();
                g._showValue(g.value);
            }
            //事件
            g.link.up.hover(function ()
            {
                if (!p.disabled)
                    $(this).addClass("l-spinner-up-over");
            }, function ()
            {
                clearInterval(g.interval);
                $(document).unbind("selectstart.spinner");
                $(this).removeClass("l-spinner-up-over");
            }).mousedown(function ()
            { 
                if (!p.disabled)
                {
                    g._uping.call(g);
                    g.interval = setInterval(function ()
                    {
                        g._uping.call(g);
                    }, p.interval);
                    $(document).bind("selectstart.spinner", function () { return false; });
                }
            }).mouseup(function ()
            {
                clearInterval(g.interval);
                g.inputText.trigger("change").focus();
                $(document).unbind("selectstart.spinner");
            });
            g.link.down.hover(function ()
            {
                if (!p.disabled)
                    $(this).addClass("l-spinner-down-over");
            }, function ()
            {
                clearInterval(g.interval);
                $(document).unbind("selectstart.spinner");
                $(this).removeClass("l-spinner-down-over");
            }).mousedown(function ()
            {
                if (!p.disabled)
                {
                    g.interval = setInterval(function ()
                    {
                        g._downing.call(g);
                    }, p.interval);
                    $(document).bind("selectstart.spinner", function () { return false; });
                }
            }).mouseup(function ()
            {
                clearInterval(g.interval);
                g.inputText.trigger("change").focus();
                $(document).unbind("selectstart.spinner");
            });

            g.inputText.change(function ()
            {
                var value = g.inputText.val();
                g.value = g._getVerifyValue(value);
                g.trigger('changeValue', [g.value]);
                g._showValue(g.value);
            }).blur(function ()
            {
                g.wrapper.removeClass("l-text-focus");
            }).focus(function ()
            {
                g.wrapper.addClass("l-text-focus");
            });
            g.wrapper.hover(function ()
            {
                if (!p.disabled)
                    g.wrapper.addClass("l-text-over");
            }, function ()
            {
                g.wrapper.removeClass("l-text-over");
            });
            g.set(p);
        },
        _setWidth: function (value)
        {
            var g = this;
            if (value > 20)
            {
                g.wrapper.css({ width: value });
                g.inputText.css({ width: value - 20 });
            }
        },
        _setHeight: function (value)
        {
            var g = this;
            if (value > 10)
            {
                g.wrapper.height(value);
                g.inputText.height(value - 2);
                g.link.height(value - 4);
            }
        },
        _setDisabled: function (value)
        {
            if (value)
            {
                this.wrapper.addClass("l-text-disabled");
            }
            else
            {
                this.wrapper.removeClass("l-text-disabled");
            }
        },
        _showValue: function (value)
        {
            var g = this, p = this.options;
            if (!value || value == "NaN") value = 0;
            if (p.type == 'float')
            {
                value = parseFloat(value).toFixed(p.decimalplace);
            }
            this.inputText.val(value)
        },
        _setValue: function (value)
        {
            this._showValue(value);
        },
        setValue: function (value)
        {
            this._showValue(value);
        },
        getValue: function ()
        {
            return this.inputText.val();
        },
        _round: function (v, e)
        {
            var g = this, p = this.options;
            var t = 1;
            for (; e > 0; t *= 10, e--) { }
            for (; e < 0; t /= 10, e++) { }
            return Math.round(v * t) / t;
        },
        _isInt: function (str)
        {
            var g = this, p = this.options;
            var strP = p.isNegative ? /^-?\d+$/ : /^\d+$/;
            if (!strP.test(str)) return false;
            if (parseFloat(str) != str) return false;
            return true;
        },
        _isFloat: function (str)
        {
            var g = this, p = this.options;
            var strP = p.isNegative ? /^-?\d+(\.\d+)?$/ : /^\d+(\.\d+)?$/;
            if (!strP.test(str)) return false;
            if (parseFloat(str) != str) return false;
            return true;
        },
        _isTime: function (str)
        {
            var g = this, p = this.options;
            var a = str.match(/^(\d{1,2}):(\d{1,2})$/);
            if (a == null) return false;
            if (a[1] > 24 || a[2] > 60) return false;
            return true;

        },
        _isVerify: function (str)
        {
            var g = this, p = this.options;
            if (p.type == 'float')
            {
                if (!g._isFloat(str)) return false;
                var value = parseFloat(str);
                if (p.minValue != undefined && p.minValue > value) return false;
                if (p.maxValue != undefined && p.maxValue < value) return false;
                return true;
            } else if (p.type == 'int')
            {
                if (!g._isInt(str)) return false;
                var value = parseInt(str);
                if (p.minValue != undefined && p.minValue > value) return false;
                if (p.maxValue != undefined && p.maxValue < value) return false;
                return true;
            } else if (p.type == 'time')
            {
                return g._isTime(str);
            }
            return false;
        },
        _getVerifyValue: function (value)
        {
            var g = this, p = this.options;
            var newvalue = null;
            if (p.type == 'float')
            {
                newvalue = g._round(value, p.decimalplace);
            }
            else if (p.type == 'int')
            {
                newvalue = parseInt(value);
            } else if (p.type == 'time')
            {
                newvalue = value;
            }
            if (!g._isVerify(newvalue))
            {
                return g.value;
            } else
            {
                return newvalue;
            }
        },
        _isOverValue: function (value)
        {
            var g = this, p = this.options;
            if (p.minValue != null && p.minValue > value) return true;
            if (p.maxValue != null && p.maxValue < value) return true;
            return false;
        },
        _getDefaultValue: function ()
        {
            var g = this, p = this.options;
            if (p.type == 'float' || p.type == 'int') { return 0; }
            else if (p.type == 'time') { return "00:00"; }
        },
        _addValue: function (num)
        {
            var g = this, p = this.options; 
            var value = g.inputText.val();
            value = parseFloat(value) + num;
            if (g._isOverValue(value)) return;
            g._showValue(value);
            g.inputText.trigger("change");
        },
        _addTime: function (minute)
        {
            var g = this, p = this.options;
            var value = g.inputText.val();
            var a = value.match(/^(\d{1,2}):(\d{1,2})$/);
            newminute = parseInt(a[2]) + minute;
            if (newminute < 10) newminute = "0" + newminute;
            value = a[1] + ":" + newminute;
            if (g._isOverValue(value)) return;
            g._showValue(value);
            g.inputText.trigger("change");
        },
        _uping: function ()
        {
            var g = this, p = this.options;
            if (p.type == 'float' || p.type == 'int')
            {
                g._addValue(p.step);
            } else if (p.type == 'time')
            {
                g._addTime(p.step);
            }
        },
        _downing: function ()
        {
            var g = this, p = this.options;
            if (p.type == 'float' || p.type == 'int')
            {
                g._addValue(-1 * p.step);
            } else if (p.type == 'time')
            {
                g._addTime(-1 * p.step);
            }
        },
        _isDateTime: function (dateStr)
        {
            var g = this, p = this.options;
            var r = dateStr.match(/^(\d{1,4})(-|\/)(\d{1,2})\2(\d{1,2})$/);
            if (r == null) return false;
            var d = new Date(r[1], r[3] - 1, r[4]);
            if (d == "NaN") return false;
            return (d.getFullYear() == r[1] && (d.getMonth() + 1) == r[3] && d.getDate() == r[4]);
        },
        _isLongDateTime: function (dateStr)
        {
            var g = this, p = this.options;
            var reg = /^(\d{1,4})(-|\/)(\d{1,2})\2(\d{1,2}) (\d{1,2}):(\d{1,2})$/;
            var r = dateStr.match(reg);
            if (r == null) return false;
            var d = new Date(r[1], r[3] - 1, r[4], r[5], r[6]);
            if (d == "NaN") return false;
            return (d.getFullYear() == r[1] && (d.getMonth() + 1) == r[3] && d.getDate() == r[4] && d.getHours() == r[5] && d.getMinutes() == r[6]);
        }
    });


})(jQuery);﻿/**
* jQuery zoeUI 1.0.0
* 
* 
*  
* 
* 
*/
(function ($)
{

    $.fn.zoeTab = function (options)
    {
        return $.zoeui.run.call(this, "zoeTab", arguments);
    };

    $.fn.zoeGetTabManager = function ()
    {
        return $.zoeui.run.call(this, "zoeGetTabManager", arguments);
    };

    $.zoeDefaults.Tab = {
        height: null,
        heightDiff: 0, // 高度补差 
        icon:null,
        changeHeightOnResize: false,
        contextmenu: true,
        dblClickToClose: false, //是否双击时关闭
        dragToMove: false,    //是否允许拖动时改变tab项的位置
        showSwitch: false,       //显示切换窗口按钮
        showSwitchInTab: false, //切换窗口按钮显示在最后一项
        onBeforeOverrideTabItem: null,
        onAfterOverrideTabItem: null,
        onBeforeRemoveTabItem: null,
        onAfterRemoveTabItem: null,
        onBeforeAddTabItem: null,
        onAfterAddTabItem: null,
        onBeforeSelectTabItem: null,
        onAfterSelectTabItem: null,
        onCloseOther: null,
        onCloseAll: null,
        onClose: null,
        onReload: null
    };
    $.zoeDefaults.TabString = {
        closeMessage: "关闭当前页",
        closeOtherMessage: "关闭其他",
        closeAllMessage: "关闭所有",
        reloadMessage: "刷新"
    };

    $.zoeMethos.Tab = {};

    $.zoeui.controls.Tab = function (element, options)
    {
        $.zoeui.controls.Tab.base.constructor.call(this, element, options);
    };
    $.zoeui.controls.Tab.zoeExtend($.zoeui.core.UIComponent, {
        __getType: function ()
        {
            return 'Tab';
        },
        __idPrev: function ()
        {
            return 'Tab';
        },
        _extendMethods: function ()
        {
            return $.zoeMethos.Tab;
        },
        _render: function ()
        {
            var g = this, p = this.options;
            if (p.height) g.makeFullHeight = true;
            g.tab = $(this.element);
            g.tab.addClass("l-tab");
            if (p.contextmenu && $.zoeMenu)
            {
                g.tab.menu = $.zoeMenu({ width: 100, items: [
                    { text: p.closeMessage, id: 'close', click: function ()
                    {
                        g._menuItemClick.apply(g, arguments);
                    }
                    },
                    { text: p.closeOtherMessage, id: 'closeother', click: function ()
                    {
                        g._menuItemClick.apply(g, arguments);
                    }
                    },
                    { text: p.closeAllMessage, id: 'closeall', click: function ()
                    {
                        g._menuItemClick.apply(g, arguments);
                    }
                    },
                    { text: p.reloadMessage, id: 'reload', click: function ()
                    {
                        g._menuItemClick.apply(g, arguments);
                    }
                    }
                ]
                });
            }
            g.tab.content = $('<div class="l-tab-content"></div>');
            $("> div", g.tab).appendTo(g.tab.content);
            g.tab.content.appendTo(g.tab);
            g.tab.links = $('<div class="l-tab-links"><ul style="left: 0px; "></ul><div class="l-tab-switch"></div></div>');
            g.tab.links.prependTo(g.tab);
            g.tab.links.ul = $("ul", g.tab.links);
            var lselecteds = $("> div[lselected=true]", g.tab.content);
            var haslselected = lselecteds.length > 0;
            g.selectedTabId = lselecteds.attr("tabid");
            $("> div", g.tab.content).each(function (i, box)
            {
                var li = $('<li class=""><span></span><a></a><div class="l-tab-links-item-left"></div><div class="l-tab-links-item-right"></div></li>');
                var contentitem = $(this);
                if (contentitem.attr("title"))
                {
                    $("> span", li).attr('style',contentitem.attr("bind-style")); //新增一个style
                    $("> a", li).html(contentitem.attr("title"));
                    contentitem.attr("title", "");
                }
                var tabid = contentitem.attr("tabid");
                if (tabid == undefined)
                {
                    tabid = g.getNewTabid();
                    contentitem.attr("tabid", tabid);
                    if (contentitem.attr("lselected"))
                    {
                        g.selectedTabId = tabid;
                    }
                }
                li.attr("tabid", tabid);
                if (!haslselected && i == 0) g.selectedTabId = tabid;
                var showClose = contentitem.attr("showClose");
                if (showClose)
                {
                    li.append("<div class='l-tab-links-item-close'></div>");
                }
                $("> ul", g.tab.links).append(li);
                if (!contentitem.hasClass("l-tab-content-item")) contentitem.addClass("l-tab-content-item");
                if (contentitem.find("iframe").length > 0)
                {
                    var iframe = $("iframe:first", contentitem);
                    if (iframe[0].readyState != "complete")
                    {
                        if (contentitem.find(".l-tab-loading:first").length == 0)
                            contentitem.prepend("<div class='l-tab-loading' style='display:block;'></div>");
                        var iframeloading = $(".l-tab-loading:first", contentitem);
                        iframe.bind('load.tab', function ()
                        {
                            iframeloading.hide();
                        });
                    }
                }
            });
            //init 
            g.selectTabItem(g.selectedTabId);
            //set content height
            if (p.height)
            {
                if (typeof (p.height) == 'string' && p.height.indexOf('%') > 0)
                {
                    g.onResize();
                    if (p.changeHeightOnResize)
                    {
                        $(window).resize(function ()
                        {
                            g.onResize.call(g);
                        });
                    }
                } else
                {
                    g.setHeight(p.height);
                }
            }
            if (g.makeFullHeight)
                g.setContentHeight();
            //add even 
            $("li", g.tab.links).each(function ()
            {
                g._addTabItemEvent($(this));
            });
            g.tab.bind('dblclick.tab', function (e)
            {
                if (!p.dblClickToClose) return;
                g.dblclicking = true;
                var obj = (e.target || e.srcElement);
                var tagName = obj.tagName.toLowerCase();
                if (tagName == "a")
                {
                    var tabid = $(obj).parent().attr("tabid");
                    var allowClose = $(obj).parent().find("div.l-tab-links-item-close").length ? true : false;
                    if (allowClose)
                    {
                        g.removeTabItem(tabid);
                    }
                }
                g.dblclicking = false;
            });

            g.set(p);
        },
        _setShowSwitch: function (value)
        {
            var g = this, p = this.options;
            if (value)
            {
                if (!$(".l-tab-switch", g.tab.links).length)
                {
                    $("<div class='l-tab-switch'></div>").appendTo(g.tab.links); 
                }
                $(g.tab).addClass("l-tab-switchable");
                $(".l-tab-switch", g.tab).click(function ()
                {
                    g.toggleSwitch(this);
                }); 
            }
            else
            {
                $(g.tab).removeClass("l-tab-switchable");
                $("body > .l-tab-windowsswitch").remove();
            }
        },
        _setShowSwitchInTab:function(value)
        {
            var g = this, p = this.options;
            if (p.showSwitch && value)
            {
                $(g.tab).removeClass("l-tab-switchable");
                $(".l-tab-switch", g.tab).remove();
                var tabitem = $("<li class='l-tab-itemswitch'><a></a><div class='l-tab-links-item-left'></div><div class='l-tab-links-item-right'></div></li>");
                tabitem.appendTo(g.tab.links.ul);
                tabitem.click(function ()
                {
                    g.toggleSwitch(this);
                });
            } else
            {
                $(".l-tab-itemswitch", g.tab.ul).remove(); 
            }
        },
        toggleSwitch: function (btn)
        {
            var g = this, p = this.options; 
            if ($("body > .l-tab-windowsswitch").length)
            {
                $("body > .l-tab-windowsswitch").remove();
                return;
            }
            if (btn == null) return;
            var windowsswitch = $("<div class='l-tab-windowsswitch'></div>").appendTo('body');
            var tabItems = g.tab.links.ul.find('>li');
            var selectedTabItemID = g.getSelectedTabItemID();
            tabItems.each(function (i, item)
            {
                var jlink = $("<a href='javascript:void(0)'></a>");
                jlink.text($(item).find("a").text());
                var tabid = $(item).attr("tabid");
                if (tabid == null) return;
                if (tabid == selectedTabItemID)
                {
                    jlink.addClass("selected");
                }
                jlink.attr("tabid", tabid);
                windowsswitch.append(jlink);
            });
            windowsswitch.css({
                top: $(btn).offset().top + $(btn).height(),
                left: $(btn).offset().left - windowsswitch.width()  
            });
            windowsswitch.bind("click", function (e)
            {
                var obj = (e.target || e.srcElement);
                if (obj.tagName.toLowerCase() == "a")
                {
                    var tabid = $(obj).attr("tabid");
                    g.selectTabItem(tabid);
                    g.moveToTabItem(tabid);
                    $("body > .l-tab-windowsswitch").remove();
                    return;
                }
            });
        },
        _applyDrag: function (tabItemDom)
        {
            var g = this, p = this.options;
            g.droptip = g.droptip || $("<div class='l-tab-drag-droptip' style='display:none'><div class='l-drop-move-up'></div><div class='l-drop-move-down'></div></div>").appendTo('body');
            var drag = $(tabItemDom).zoeDrag(
            {
                revert: true, animate: false,
                proxy: function ()
                {
                    var name = $(this).find("a").html();
                    g.dragproxy = $("<div class='l-tab-drag-proxy' style='display:none'><div class='l-drop-icon l-drop-no'></div></div>").appendTo('body');
                    g.dragproxy.append(name);
                    return g.dragproxy;
                },
                onRendered: function ()
                {
                    this.set('cursor', 'pointer');
                },
                onStartDrag: function (current, e)
                {
                    if (!$(tabItemDom).hasClass("l-selected")) return false;
                    if (e.button == 2) return false;
                    var obj = e.srcElement || e.target;
                    if ($(obj).hasClass("l-tab-links-item-close")) return false;
                },
                onDrag: function (current, e)
                {
                    if (g.dropIn == null)
                        g.dropIn = -1;
                    var tabItems = g.tab.links.ul.find('>li');
                    var targetIndex = tabItems.index(current.target);
                    tabItems.each(function (i, item)
                    {
                        if (targetIndex == i)
                        {
                            return;
                        }
                        var isAfter = i > targetIndex;
                        if (g.dropIn != -1 && g.dropIn != i) return;
                        var offset = $(this).offset();
                        var range = {
                            top: offset.top,
                            bottom: offset.top + $(this).height(),
                            left: offset.left - 10,
                            right: offset.left + 10
                        };
                        if (isAfter)
                        {
                            range.left += $(this).width();
                            range.right += $(this).width();
                        }
                        var pageX = e.pageX || e.screenX;
                        var pageY = e.pageY || e.screenY;
                        if (pageX > range.left && pageX < range.right && pageY > range.top && pageY < range.bottom)
                        {
                            g.droptip.css({
                                left: range.left + 5,
                                top: range.top - 9
                            }).show();
                            g.dropIn = i;
                            g.dragproxy.find(".l-drop-icon").removeClass("l-drop-no").addClass("l-drop-yes");
                        }
                        else
                        {
                            g.dropIn = -1;
                            g.droptip.hide();
                            g.dragproxy.find(".l-drop-icon").removeClass("l-drop-yes").addClass("l-drop-no");
                        }
                    });
                },
                onStopDrag: function (current, e)
                {
                    if (g.dropIn > -1)
                    {
                        var to = g.tab.links.ul.find('>li:eq(' + g.dropIn + ')').attr("tabid");
                        var from = $(current.target).attr("tabid");
                        setTimeout(function ()
                        {
                            g.moveTabItem(from, to);
                        }, 0);
                        g.dropIn = -1;
                        g.dragproxy.remove();
                    }
                    g.droptip.hide();
                    this.set('cursor', 'default');
                }
            });
            return drag;
        },
        _setDragToMove: function (value)
        {
            if (!$.fn.zoeDrag) return; //需要zoeDrag的支持
            var g = this, p = this.options;
            if (value)
            {
                if (g.drags) return;
                g.drags = g.drags || [];
                g.tab.links.ul.find('>li').each(function ()
                {
                    g.drags.push(g._applyDrag(this));
                });
            }
        },
        moveTabItem: function (fromTabItemID, toTabItemID)
        {
            var g = this;
            var from = g.tab.links.ul.find(">li[tabid=" + fromTabItemID + "]");
            var to = g.tab.links.ul.find(">li[tabid=" + toTabItemID + "]");
            var index1 = g.tab.links.ul.find(">li").index(from);
            var index2 = g.tab.links.ul.find(">li").index(to);
            if (index1 < index2)
            {
                to.after(from);
            }
            else
            {
                to.before(from);
            }
        },
        //设置tab按钮(左和右),显示返回true,隐藏返回false
        setTabButton: function ()
        {
            var g = this, p = this.options;
            var sumwidth = 0;
            $("li", g.tab.links.ul).each(function ()
            {
                sumwidth += $(this).width() + 2;
            });
            var mainwidth = g.tab.width();
            if (sumwidth > mainwidth)
            {
                if (!$(".l-tab-links-left", g.tab).length)
                {
                    g.tab.links.append('<div class="l-tab-links-left"><span></span></div><div class="l-tab-links-right"><span></span></div>');
                    g.setTabButtonEven();
                }
                return true;
            } else
            {
                g.tab.links.ul.animate({ left: 0 });
                $(".l-tab-links-left,.l-tab-links-right", g.tab.links).remove();
                return false;
            }
        },
        //设置左右按钮的事件 标签超出最大宽度时，可左右拖动
        setTabButtonEven: function ()
        {
            var g = this, p = this.options;
            $(".l-tab-links-left", g.tab.links).hover(function ()
            {
                $(this).addClass("l-tab-links-left-over");
            }, function ()
            {
                $(this).removeClass("l-tab-links-left-over");
            }).click(function ()
            {
                g.moveToPrevTabItem();
            });
            $(".l-tab-links-right", g.tab.links).hover(function ()
            {
                $(this).addClass("l-tab-links-right-over");
            }, function ()
            {
                $(this).removeClass("l-tab-links-right-over");
            }).click(function ()
            {
                g.moveToNextTabItem();
            });
        },
        //切换到上一个tab
        moveToPrevTabItem: function (tabid)
        {
            var g = this, p = this.options;
            var tabItems = $("> li", g.tab.links.ul),
                 nextBtn = $(".l-tab-links-right", g.tab),
                 prevBtn = $(".l-tab-links-left", g.tab);
            if (!nextBtn.length || !prevBtn.length) return false;
            var nextBtnOffset = nextBtn.offset(), prevBtnOffset = prevBtn.offset();
            //计算应该移动到的标签项,并计算从第一项到这个标签项的上一项的宽度总和
            var moveToTabItem = null, currentWidth = 0;
            var prevBtnLeft = prevBtnOffset.left + prevBtn.outerWidth();
            for (var i = 0, l = tabItems.length; i < l; i++)
            {
                var tabitem = $(tabItems[i]);  
                var offset = tabitem.offset();
                var start = offset.left, end = offset.left + tabitem.outerWidth();
                if (tabid != null)
                {
                    if (start < prevBtnLeft && tabitem.attr("tabid") == tabid)
                    {
                        moveToTabItem = tabitem;
                        break;
                    }
                }
                else if (start < prevBtnLeft && end >= prevBtnLeft)
                {
                    moveToTabItem = tabitem;
                    break;
                }
                currentWidth += tabitem.outerWidth() + parseInt(tabitem.css("marginLeft"))
                    + parseInt(tabitem.css("marginRight"));
            }
            if (moveToTabItem == null) return false;
            //计算出正确的移动位置
            var left = currentWidth - prevBtn.outerWidth();
            g.tab.links.ul.animate({ left: -1 * left });
            return true;
        },
        //切换到下一个tab
        moveToNextTabItem: function (tabid)
        {
            var g = this, p = this.options;
            var tabItems = $("> li", g.tab.links.ul),
                nextBtn = $(".l-tab-links-right", g.tab),
                prevBtn = $(".l-tab-links-left", g.tab);
            if (!nextBtn.length || !prevBtn.length) return false;
            var nextBtnOffset = nextBtn.offset(), prevBtnOffset = prevBtn.offset();
            //计算应该移动到的标签项,并计算从第一项到这个标签项的宽度总和
            var moveToTabItem = null, currentWidth = 0;
            for (var i = 0, l = tabItems.length; i < l; i++)
            { 
                var tabitem = $(tabItems[i]);
                currentWidth += tabitem.outerWidth()
                    + parseInt(tabitem.css("marginLeft"))
                    + parseInt(tabitem.css("marginRight"));
                var offset = tabitem.offset();
                var start = offset.left, end = offset.left + tabitem.outerWidth();
                if (tabid != null)
                {
                    if (end > nextBtnOffset.left && tabitem.attr("tabid") == tabid)
                    {
                        moveToTabItem = tabitem;
                        break;
                    }
                }
                else if (start <= nextBtnOffset.left && end > nextBtnOffset.left)
                {
                    moveToTabItem = tabitem;
                    break;
                }
            }
            if (moveToTabItem == null) return false;
            //计算出正确的移动位置
            var left = currentWidth - (nextBtnOffset.left - prevBtnOffset.left)
                + parseInt(moveToTabItem.css("marginLeft")) + parseInt(moveToTabItem.css("marginRight"));
            g.tab.links.ul.animate({ left: -1 * left });
            return true;
        },
        //切换到指定的项目项
        moveToTabItem: function (tabid)
        {
            var g = this, p = this.options;
            if (!g.moveToPrevTabItem(tabid))
            {
                g.moveToNextTabItem(tabid);
            }
        },
        getTabItemCount: function ()
        {
            var g = this, p = this.options;
            return $("li", g.tab.links.ul).length;
        },
        getSelectedTabItemID: function ()
        {
            var g = this, p = this.options;
            return $("li.l-selected", g.tab.links.ul).attr("tabid");
        },
        removeSelectedTabItem: function ()
        {
            var g = this, p = this.options;
            g.removeTabItem(g.getSelectedTabItemID());
        },
        //覆盖选择的tabitem
        overrideSelectedTabItem: function (options)
        {
            var g = this, p = this.options;
            g.overrideTabItem(g.getSelectedTabItemID(), options);
        },
        //覆盖
        overrideTabItem: function (targettabid, options)
        {
            var g = this, p = this.options;
            if (g.trigger('beforeOverrideTabItem', [targettabid]) == false)
                return false;
            var tabid = options.tabid;
            if (tabid == undefined) tabid = g.getNewTabid();
            var url = options.url;
            var content = options.content;
            var target = options.target;
            var text = options.text;
            var showClose = options.showClose;
            var height = options.height;
            //如果已经存在
            if (g.isTabItemExist(tabid))
            {
                return;
            }
            var tabitem = $("li[tabid=" + targettabid + "]", g.tab.links.ul);
            var contentitem = $(".l-tab-content-item[tabid=" + targettabid + "]", g.tab.content);
            if (!tabitem || !contentitem) return;
            tabitem.attr("tabid", tabid);
            contentitem.attr("tabid", tabid);
            if ($("iframe", contentitem).length == 0 && url)
            {
                contentitem.html("<iframe frameborder='0'></iframe>");
            }
            else if (content)
            {
                contentitem.html(content);
            }
            $("iframe", contentitem).attr("name", tabid);
            if (showClose == undefined) showClose = true;
            if (showClose == false) $(".l-tab-links-item-close", tabitem).remove();
            else
            {
                if ($(".l-tab-links-item-close", tabitem).length == 0)
                    tabitem.append("<div class='l-tab-links-item-close'></div>");
            }
            if (text == undefined) text = tabid;
            if (height) contentitem.height(height);
            $("a", tabitem).text(text);
            $("iframe", contentitem).attr("src", url);


            g.trigger('afterOverrideTabItem', [targettabid]);
        },
        //设置页签项标题
        setHeader: function(tabid,header)
        { 
            $("li[tabid=" + tabid + "] a", this.tab.links.ul).text(header);
        },
        //选中tab项
        selectTabItem: function (tabid)
        {
            var g = this, p = this.options;
            if (g.trigger('beforeSelectTabItem', [tabid]) == false)
                return false;
            g.selectedTabId = tabid;
            $("> .l-tab-content-item[tabid=" + tabid + "]", g.tab.content).show().siblings().hide();
            $("li[tabid=" + tabid + "]", g.tab.links.ul).addClass("l-selected").siblings().removeClass("l-selected");
            g.trigger('afterSelectTabItem', [tabid]);
        },
        //移动到最后一个tab
        moveToLastTabItem: function ()
        {
            var g = this, p = this.options;
            var sumwidth = 0;
            $("li", g.tab.links.ul).each(function ()
            {
                sumwidth += $(this).width() + 2;
            });
            var mainwidth = g.tab.width();
            if (sumwidth > mainwidth)
            {
                var btnWitdth = $(".l-tab-links-right", g.tab.links).width();
                g.tab.links.ul.animate({ left: -1 * (sumwidth - mainwidth + btnWitdth + 2) });
            }
        },
        //判断tab是否存在
        isTabItemExist: function (tabid)
        {
            var g = this, p = this.options;
            return $("li[tabid=" + tabid + "]", g.tab.links.ul).length > 0;
        },
        //增加一个tab
        addTabItem: function (options)
        {
            var g = this, p = this.options; 
            if (g.trigger('beforeAddTabItem', [options]) == false)
                return false;
            var tabid = options.tabid;
            if (tabid == undefined) tabid = g.getNewTabid();
            var url = options.url, content = options.content, text = options.text, showClose = options.showClose, height = options.height;var icon = options.icon;
            var icon = options.icon;
            //如果已经存在
            if (g.isTabItemExist(tabid))
            {
                g.selectTabItem(tabid);
                return;
            }
            var iconitem = "<span style='background-image:url(" + icon + ");'></span>";
            var tabitem = $("<li>" + iconitem + "<a></a><div class='l-tab-links-item-left'></div><div class='l-tab-links-item-right'></div><div class='l-tab-links-item-close'></div></li>");            
            var contentitem = $("<div class='l-tab-content-item'><div class='l-tab-loading' style='display:block;'></div><iframe frameborder='0'></iframe></div>");
            var iframeloading = $("div:first", contentitem);
            var iframe = $("iframe:first", contentitem);
            if (g.makeFullHeight)
            {
                var newheight = g.tab.height() - g.tab.links.height();
                contentitem.height(newheight);
            }
            tabitem.attr("tabid", tabid);
            contentitem.attr("tabid", tabid); 
            if (url)
            {
                iframe[0].tab = g;//增加iframe对tab对象的引用 
                iframe.attr("name", tabid)
                 .attr("id", tabid)
                 .attr("src", url)
                 .bind('load.tab', function ()
                 {
                     iframeloading.hide();
                     if (options.callback)
                         options.callback();
                 });
            }
            else
            {
                iframe.remove(); 
                iframeloading.remove();
            }
            if (content)
            {
                contentitem.html(content);
                if (options.callback)
                    options.callback();
            }
            else if (options.target)
            {
                contentitem.append(options.target);
                if (options.callback)
                    options.callback();
            }
            if (showClose == undefined) showClose = true;
            if (showClose == false) $(".l-tab-links-item-close", tabitem).remove();
            if (text == undefined) text = tabid;
            if (height) contentitem.height(height);
            $("a", tabitem).text(text);
            if ($(".l-tab-itemswitch", g.tab.links.ul).length)
            {
                tabitem.insertBefore($(".l-tab-itemswitch", g.tab.links.ul));
            } else
            {
                g.tab.links.ul.append(tabitem);
            }
            g.tab.content.append(contentitem);
            g.selectTabItem(tabid); 
            if (g.setTabButton())
            { 
                g.moveToTabItem(tabid);
            } 
            //增加事件
            g._addTabItemEvent(tabitem);
            if (p.dragToMove && $.fn.zoeDrag)
            {
                g.drags = g.drags || [];
                tabitem.each(function ()
                {
                    g.drags.push(g._applyDrag(this));
                });
            }
            g.toggleSwitch();
            g.trigger('afterAddTabItem', [options]);
        },
        _addTabItemEvent: function (tabitem)
        {
            var g = this, p = this.options;
            tabitem.click(function ()
            {
                var tabid = $(this).attr("tabid");
                g.selectTabItem(tabid);
            });
            //右键事件支持
            g.tab.menu && g._addTabItemContextMenuEven(tabitem);
            $(".l-tab-links-item-close", tabitem).hover(function ()
            {
                $(this).addClass("l-tab-links-item-close-over");
            }, function ()
            {
                $(this).removeClass("l-tab-links-item-close-over");
            }).click(function ()
            {
                var tabid = $(this).parent().attr("tabid");
                g.removeTabItem(tabid);
            });

        },
        //移除tab项
        removeTabItem: function (tabid)
        {
            var g = this, p = this.options; 
            if (g.trigger('beforeRemoveTabItem', [tabid]) == false)
                return false;
            var currentIsSelected = $("li[tabid=" + tabid + "]", g.tab.links.ul).hasClass("l-selected");
            if (currentIsSelected)
            {
                $(".l-tab-content-item[tabid=" + tabid + "]", g.tab.content).prev().show();
                $("li[tabid=" + tabid + "]", g.tab.links.ul).prev().addClass("l-selected").siblings().removeClass("l-selected");
            }
            var contentItem = $(".l-tab-content-item[tabid=" + tabid + "]", g.tab.content); 
            var jframe = $('iframe', contentItem); 
            if (jframe.length)
            {
                var frame = jframe[0];
                frame.src = "about:blank";
                try
                {
                    frame.contentWindow.document.write('');
                } catch (e)
                {
                }
                $.browser.msie && CollectGarbage();
                jframe.remove();
            } 
            contentItem.remove();
            $("li[tabid=" + tabid + "]", g.tab.links.ul).remove();
            g.setTabButton();
            g.trigger('afterRemoveTabItem', [tabid]);
        },
        addHeight: function (heightDiff)
        {
            var g = this, p = this.options;
            var newHeight = g.tab.height() + heightDiff;
            g.setHeight(newHeight);
        },
        setHeight: function (height)
        {
            var g = this, p = this.options;
            g.tab.height(height);
            g.setContentHeight();
        },
        setContentHeight: function ()
        {
            var g = this, p = this.options;
            var newheight = g.tab.height() - g.tab.links.height();
            g.tab.content.height(newheight);
            $("> .l-tab-content-item", g.tab.content).height(newheight);
        },
        getNewTabid: function ()
        {
            var g = this, p = this.options;
            g.getnewidcount = g.getnewidcount || 0;
            return 'tabitem' + (++g.getnewidcount);
        },
        //notabid 过滤掉tabid的
        //noclose 过滤掉没有关闭按钮的
        getTabidList: function (notabid, noclose)
        {
            var g = this, p = this.options;
            var tabidlist = [];
            $("> li", g.tab.links.ul).each(function ()
            {
                if ($(this).attr("tabid")
                        && $(this).attr("tabid") != notabid
                        && (!noclose || $(".l-tab-links-item-close", this).length > 0))
                {
                    tabidlist.push($(this).attr("tabid"));
                }
            });
            return tabidlist;
        },
        removeOther: function (tabid, compel)
        {
            var g = this, p = this.options;
            var tabidlist = g.getTabidList(tabid, true);
            $(tabidlist).each(function ()
            {
                g.removeTabItem(this);
            });
        },
        reload: function (tabid)
        {
            var g = this, p = this.options;
            var contentitem = $(".l-tab-content-item[tabid=" + tabid + "]");
            var iframeloading = $(".l-tab-loading:first", contentitem);
            var iframe = $("iframe:first", contentitem);
            var url = $(iframe).attr("src");
            iframeloading.show();
            iframe.attr("src", url).unbind('load.tab').bind('load.tab', function ()
            {
                iframeloading.hide();
            });
        },
        removeAll: function (compel)
        {
            var g = this, p = this.options;
            var tabidlist = g.getTabidList(null, true);
            $(tabidlist).each(function ()
            {
                g.removeTabItem(this);
            });
        },
        onResize: function ()
        {
            var g = this, p = this.options;
            if (!p.height || typeof (p.height) != 'string' || p.height.indexOf('%') == -1) return false;
            //set tab height
            if (g.tab.parent()[0].tagName.toLowerCase() == "body")
            {
                var windowHeight = $(window).height();
                windowHeight -= parseInt(g.tab.parent().css('paddingTop'));
                windowHeight -= parseInt(g.tab.parent().css('paddingBottom'));
                g.height = p.heightDiff + windowHeight * parseFloat(g.height) * 0.01;
            }
            else
            {
                g.height = p.heightDiff + (g.tab.parent().height() * parseFloat(p.height) * 0.01);
            }
            g.tab.height(g.height);
            g.setContentHeight();
        },
        _menuItemClick: function (item)
        {
            var g = this, p = this.options;
            if (!item.id || !g.actionTabid) return;
            switch (item.id)
            {
                case "close":
                    if (g.trigger('close') == false) return;
                    g.removeTabItem(g.actionTabid);
                    g.actionTabid = null;
                    break;
                case "closeother":
                    if (g.trigger('closeother') == false) return;
                    g.removeOther(g.actionTabid);
                    break;
                case "closeall":
                    if (g.trigger('closeall') == false) return;
                    g.removeAll();
                    g.actionTabid = null;
                    break;
                case "reload":
                    if (g.trigger('reload', [{ tabid: g.actionTabid }]) == false) return;
                    g.selectTabItem(g.actionTabid);
                    g.reload(g.actionTabid);
                    break;
            }
        },
        _addTabItemContextMenuEven: function (tabitem)
        {
            var g = this, p = this.options;
            tabitem.bind("contextmenu", function (e)
            {
                if (!g.tab.menu) return;
                g.actionTabid = tabitem.attr("tabid");
                g.tab.menu.show({ top: e.pageY, left: e.pageX });
                if ($(".l-tab-links-item-close", this).length == 0)
                {
                    g.tab.menu.setDisabled('close');
                }
                else
                {
                    g.tab.menu.setEnabled('close');
                }
                return false;
            });
        }
    });



})(jQuery);﻿/**
* jQuery zoeUI 1.0.0
* 
* 
*  
* 
* 
*/
(function ($)
{
    $.fn.zoeTextBox = function ()
    {
        return $.zoeui.run.call(this, "zoeTextBox", arguments);
    };

    $.fn.zoeGetTextBoxManager = function ()
    {
        return $.zoeui.run.call(this, "zoeGetTextBoxManager", arguments);
    };

    $.zoeDefaults.TextBox = {
        onChangeValue: null,
        onMouseOver: null,
        onMouseOut: null,
        onBlur: null,
        onFocus: null,
        width: null,
        disabled: false,
        value: null,     //初始化值 
        nullText: null,   //不能为空时的提示
        digits: false,     //是否限定为数字输入框
        number: false,    //是否限定为浮点数格式输入框
        currency: false,     //是否显示为货币形式
        readonly: false              //是否只读
    };


    $.zoeui.controls.TextBox = function (element, options)
    {
        $.zoeui.controls.TextBox.base.constructor.call(this, element, options);
    };

    $.zoeui.controls.TextBox.zoeExtend($.zoeui.controls.Input, {
        __getType: function ()
        {
            return 'TextBox'
        },
        __idPrev: function ()
        {
            return 'TextBox';
        },
        _init: function ()
        {
            $.zoeui.controls.TextBox.base._init.call(this);
            var g = this, p = this.options;
            if (!p.width)
            {
                p.width = $(g.element).width();
            }
            if ($(this.element).attr("readonly"))
            {
                p.readonly = true;
            } else if (p.readonly)
            {
                $(this.element).attr("readonly", true);
            }
        },
        _render: function ()
        {
            var g = this, p = this.options;
            g.inputText = $(this.element);
            //外层
            g.wrapper = g.inputText.wrap('<div class="l-text"></div>').parent();
            g.wrapper.append('<div class="l-text-l"></div><div class="l-text-r"></div>');
            if (!g.inputText.hasClass("l-text-field"))
                g.inputText.addClass("l-text-field");
            this._setEvent();
            if (p.digits || p.number || p.currency)
            {
                g.inputText.addClass("l-text-field-number");
            }
            g.set(p);
            g.checkValue();
        },
        destroy: function ()
        {
            var g = this;
            if (g.wrapper)
            {
                g.wrapper.remove();
            }
            g.options = null;
            zoe.remove(this);
        },
        _getValue: function ()
        {
            return this.inputText.val();
        },
        _setNullText: function ()
        {
            this.checkNotNull();
        },
        checkValue: function ()
        {
            var g = this, p = this.options;
            var v = g.inputText.val() || "";
            if (p.currency) v = v.replace(/\$|\,/g, '');
            var isFloat = p.number || p.currency, isDigits = p.digits;
            if (v != "" && isFloat && !/^-?(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d+)?$/.test(v) || isDigits && !/^\d+$/.test(v))
            {
                if (g.value != null)
                {
                    //不符合,恢复到原来的值
                    g.inputText.val(g.value);
                }
                else
                {
                    g.inputText.val('');
                }
                p.currency && g.inputText.val(currencyFormatter(g.value));
                return;
            }
            g.value = v;
            p.currency && g.inputText.val(currencyFormatter(g.value));
        },
        checkNotNull: function ()
        {
            var g = this, p = this.options;
            if (p.nullText && !p.disabled)
            {
                if (!g.inputText.val())
                {
                    g.inputText.addClass("l-text-field-null").val(p.nullText);
                }
            }
        },
        _setEvent: function ()
        {
            var g = this, p = this.options;
            g.inputText.bind('blur.textBox', function ()
            {
                g.trigger('blur');
                g.checkNotNull();
                g.checkValue();
                g.wrapper.removeClass("l-text-focus");
            }).bind('focus.textBox', function ()
            {
                g.trigger('focus');
                if (p.nullText)
                {
                    if ($(this).hasClass("l-text-field-null"))
                    {
                        $(this).removeClass("l-text-field-null").val("");
                    }
                }
                g.wrapper.addClass("l-text-focus");
            })
            .change(function ()
            {
                g.trigger('changeValue', [this.value]);
            });
            g.wrapper.hover(function ()
            {
                g.trigger('mouseOver');
                g.wrapper.addClass("l-text-over");
            }, function ()
            {
                g.trigger('mouseOut');
                g.wrapper.removeClass("l-text-over");
            });
        },
        _setDisabled: function (value)
        {
            var g = this, p = this.options;
            if (value)
            {
                this.inputText.attr("readonly", "readonly");
                this.wrapper.addClass("l-text-disabled");
            }
            else if (!p.readonly)
            {
                this.inputText.removeAttr("readonly");
                this.wrapper.removeClass('l-text-disabled');
            }
        },
        _setWidth: function (value)
        {
            if (value > 20)
            {
                this.wrapper.css({ width: value });
                this.inputText.css({ width: value - 4 });
            }
        },
        _setHeight: function (value)
        {
            if (value > 10)
            {
                this.wrapper.height(value);
                this.inputText.height(value - 2);
            }
        },
        _setValue: function (value)
        {
            if (value != null)
                this.inputText.val(value);
        },
        _setLabel: function (value)
        {
            var g = this, p = this.options;
            if (!g.labelwrapper)
            {
                g.labelwrapper = g.wrapper.wrap('<div class="l-labeltext"></div>').parent();
                var lable = $('<div class="l-text-label" style="float:left;">' + value + ':&nbsp</div>');
                g.labelwrapper.prepend(lable);
                g.wrapper.css('float', 'left');
                if (!p.labelWidth)
                {
                    p.labelWidth = lable.width();
                }
                else
                {
                    g._setLabelWidth(p.labelWidth);
                }
                lable.height(g.wrapper.height());
                if (p.labelAlign)
                {
                    g._setLabelAlign(p.labelAlign);
                }
                g.labelwrapper.append('<br style="clear:both;" />');
                g.labelwrapper.width(p.labelWidth + p.width + 2);
            }
            else
            {
                g.labelwrapper.find(".l-text-label").html(value + ':&nbsp');
            }
        },
        _setLabelWidth: function (value)
        {
            var g = this, p = this.options;
            if (!g.labelwrapper) return;
            g.labelwrapper.find(".l-text-label").width(value);
        },
        _setLabelAlign: function (value)
        {
            var g = this, p = this.options;
            if (!g.labelwrapper) return;
            g.labelwrapper.find(".l-text-label").css('text-align', value);
        },
        updateStyle: function ()
        {
            var g = this, p = this.options;
            if (g.inputText.attr('readonly'))
            {
                g.wrapper.addClass("l-text-readonly");
                p.disabled = true;
            }
            else
            {
                g.wrapper.removeClass("l-text-readonly");
                p.disabled = false;
            }
            if (g.inputText.attr('disabled'))
            {
                g.wrapper.addClass("l-text-disabled");
                p.disabled = true;
            }
            else
            {
                g.wrapper.removeClass("l-text-disabled");
                p.disabled = false;
            }
            if (g.inputText.hasClass("l-text-field-null") && g.inputText.val() != p.nullText)
            {
                g.inputText.removeClass("l-text-field-null");
            }
            g.checkValue();
        },
        setValue: function (value)
        {
            this._setValue(value);
            this.trigger('changeValue', [value]);
        }
    });

    function currencyFormatter(num)
    {
        if (!num) return "0.00";
        num = num.toString().replace(/\$|\,/g, '');
        if (isNaN(num))
            num = "0.00";
        sign = (num == (num = Math.abs(num)));
        num = Math.floor(num * 100 + 0.50000000001);
        cents = num % 100;
        num = Math.floor(num / 100).toString();
        if (cents < 10)
            cents = "0" + cents;
        for (var i = 0; i < Math.floor((num.length - (1 + i)) / 3) ; i++)
            num = num.substring(0, num.length - (4 * i + 3)) + ',' +
            num.substring(num.length - (4 * i + 3));
        return "" + (((sign) ? '' : '-') + '' + num + '.' + cents);
    }

})(jQuery);﻿/**
* jQuery zoeUI 1.0.0
* 
* 
*  
* 
* 
*/

(function ($)
{
    //气泡,可以在制定位置显示
    $.zoeTip = function (p)
    {
        return $.zoeui.run.call(null, "zoeTip", arguments);
    };

    //在指定Dom Element右侧显示气泡
    //target：将zoeui对象ID附加上
    $.fn.zoeTip = function (options)
    {
        this.each(function ()
        {
            var p = $.extend({}, $.zoeDefaults.ElementTip, options || {});
            p.target = p.target || this;
            //如果是自动模式：鼠标经过时显示，移开时关闭
            if (p.auto || options == undefined)
            {
                if (!p.content)
                {
                    p.content = this.title;
                    if (p.removeTitle)
                        $(this).removeAttr("title");
                }
                p.content = p.content || this.title;
                $(this).bind('mouseover.tip', function ()
                {
                    p.x = $(this).offset().left + $(this).width() + (p.distanceX || 0);
                    p.y = $(this).offset().top + (p.distanceY || 0);
                    $.zoeTip(p);
                }).bind('mouseout.tip', function ()
                {

                    var tipmanager = $.zoeui.managers[this.zoeuitipid];
                    if (tipmanager)
                    {
                        tipmanager.remove();
                    }
                });
            }
            else
            {
                if (p.target.zoeuitipid) return;
                p.x = $(this).offset().left + $(this).width() + (p.distanceX || 0);
                p.y = $(this).offset().top + (p.distanceY || 0);
                p.x = p.x || 0;
                p.y = p.y || 0;
                $.zoeTip(p);
            }
        });
        return $.zoeui.get(this, 'zoeuitipid');
    };
    //关闭指定在Dom Element(附加了zoeui对象ID,属性名"zoeuitipid")显示的气泡
    $.fn.zoeHideTip = function (options)
    {
        return this.each(function ()
        {
            var p = options || {};
            if (p.isLabel == undefined)
            {
                //如果是lable，将查找指定的input，并找到zoeui对象ID
                p.isLabel = this.tagName.toLowerCase() == "label" && $(this).attr("for") != null;
            }
            var target = this;
            if (p.isLabel)
            {
                var forele = $("#" + $(this).attr("for"));
                if (forele.length == 0) return;
                target = forele[0];
            }
            var tipmanager = $.zoeui.managers[target.zoeuitipid];
            if (tipmanager)
            {
                tipmanager.remove();
            }
        }).unbind('mouseover.tip').unbind('mouseout.tip');
    };


    $.fn.zoeGetTipManager = function ()
    {
        return $.zoeui.get(this);
    };


    $.zoeDefaults = $.zoeDefaults || {};


    //隐藏气泡
    $.zoeDefaults.HideTip = {};

    //气泡
    $.zoeDefaults.Tip = {
        content: null,
        callback: null,
        width: "auto",
        height: null,
        x: 0,
        y: 0,
        appendIdTo: null,       //保存ID到那一个对象(jQuery)(待移除)
        target: null,
        auto: null,             //是否自动模式，如果是，那么：鼠标经过时显示，移开时关闭,并且当content为空时自动读取attr[title]
        removeTitle: true        //自动模式时，默认是否移除掉title
    };

    //在指定Dom Element右侧显示气泡,通过$.fn.zoeTip调用
    $.zoeDefaults.ElementTip = {
        distanceX: 1,
        distanceY: -3,
        auto: null,
        removeTitle: true
    };

    $.zoeMethos.Tip = {};

    $.zoeui.controls.Tip = function (options)
    {
        $.zoeui.controls.Tip.base.constructor.call(this, null, options);
    };
    $.zoeui.controls.Tip.zoeExtend($.zoeui.core.UIComponent, {
        __getType: function ()
        {
            return 'Tip';
        },
        __idPrev: function ()
        {
            return 'Tip';
        },
        _extendMethods: function ()
        {
            return $.zoeMethos.Tip;
        },
        _render: function ()
        {
            var g = this, p = this.options;
            var tip = $('<div class="l-verify-tip"><div class="l-verify-tip-corner"></div><div class="l-verify-tip-content"></div></div>');
            g.tip = tip;
            g.tip.attr("id", g.id);
            if (p.content)
            {
                $("> .l-verify-tip-content:first", tip).html(p.content);
                tip.appendTo('body');
            }
            else
            {
                return;
            }
            tip.css({ left: p.x, top: p.y }).show();
            p.width && $("> .l-verify-tip-content:first", tip).width(p.width - 8);
            p.height && $("> .l-verify-tip-content:first", tip).width(p.height);
            eee = p.appendIdTo;
            if (p.appendIdTo)
            {
                p.appendIdTo.attr("zoeTipId", g.id);
            }
            if (p.target)
            {
                $(p.target).attr("zoeTipId", g.id);
                p.target.zoeuitipid = g.id;
            }
            p.callback && p.callback(tip);
            g.set(p);
        },
        _setContent: function (content)
        {
            $("> .l-verify-tip-content:first", this.tip).html(content);
        },
        remove: function ()
        {
            if (this.options.appendIdTo)
            {
                this.options.appendIdTo.removeAttr("zoeTipId");
            }
            if (this.options.target)
            {
                $(this.options.target).removeAttr("zoeTipId");
                this.options.target.zoeuitipid = null;
            }
            this.tip.remove();
        }
    });
})(jQuery);﻿﻿/**
* jQuery zoeUI 1.0.0
* 
* 
*  
* 
* 
*/
(function ($)
{
    $.fn.zoeTree = function (options)
    {
        return $.zoeui.run.call(this, "zoeTree", arguments);
    };

    $.fn.zoeGetTreeManager = function ()
    {
        return $.zoeui.run.call(this, "zoeGetTreeManager", arguments);
    };

    $.zoeDefaults.Tree = {
        url: null,
        data: null,
        checkbox: true,
        autoCheckboxEven: true,
        parentIcon: 'folder',
        childIcon: 'leaf',
        textFieldName: 'text',
        attribute: ['id', 'url'],
        treeLine: true,            //是否显示line
        nodeWidth: 90,
        statusName: '__status',
        isLeaf: null,              //是否子节点的判断函数
        single: false,               //是否单选
        needCancel: true,			//已选的是否需要取消操作
        onBeforeExpand: function () { },
        onContextmenu: function () { },
        onExpand: function () { },
        onBeforeCollapse: function () { },
        onCollapse: function () { },
        onBeforeSelect: function () { },
        onSelect: function () { },
        onBeforeCancelSelect: function () { },
        onCancelselect: function () { },
        onCheck: function () { },
        onSuccess: function () { },
        onError: function () { },
        onClick: function () { },
        idFieldName: 'id',
        parentIDFieldName: null,
        topParentIDValue: 0,
        onBeforeAppend: function () { },        //加载数据前事件，可以通过return false取消操作
        onAppend: function () { },             //加载数据时事件，对数据进行预处理以后
        onAfterAppend: function () { },         //加载数据完事件
        slide: true,          //是否以动画的形式显示
        iconFieldName: 'icon',
        nodeDraggable: false,             //是否允许拖拽
        nodeDraggingRender: null,
        btnClickToToggleOnly: true,     //是否点击展开/收缩 按钮时才有效
        ajaxType: 'post',
        render: null,               //自定义函数
        selectable: null,           //可选择判断函数
        parentsCheckbox:true,   //父节点是否显示复选框
        /*
        是否展开 
            1,可以是true/false 
            2,也可以是数字(层次)N 代表第1层到第N层都是展开的，其他收缩
            3,或者是判断函数 函数参数e(data,level) 返回true/false

        优先级没有节点数据的isexpand属性高,并没有delay属性高
        */
        isExpand: null,
        /*
        是否延迟加载 
            1,可以是true/false 
            2,也可以是数字(层次)N 代表第N层延迟加载 
            3,或者是字符串(Url) 加载数据的远程地址
            4,如果是数组,代表这些层都延迟加载,如[1,2]代表第1、2层延迟加载
            5,再是函数(运行时动态获取延迟加载参数) 函数参数e(data,level),返回true/false或者{url:...,parms:...}

        优先级没有节点数据的delay属性高
        */
        delay: null
    };

    $.zoeui.controls.Tree = function (element, options)
    {
        $.zoeui.controls.Tree.base.constructor.call(this, element, options);
    };

    $.zoeui.controls.Tree.zoeExtend($.zoeui.core.UIComponent, {
        _init: function ()
        {
            $.zoeui.controls.Tree.base._init.call(this);
            var g = this, p = this.options;
            if (p.single) p.autoCheckboxEven = false;
        },
        _render: function ()
        {
            var g = this, p = this.options;
            g.set(p, true);
            g.tree = $(g.element);
            g.tree.addClass('l-tree');
            g.toggleNodeCallbacks = [];
            g.sysAttribute = ['isexpand', 'ischecked', 'style', 'delay'];
            g.loading = $("<div class='l-tree-loading'></div>");
            g.tree.after(g.loading);
            g.data = [];
            g.maxOutlineLevel = 1;
            g.treedataindex = 0;
            g._applyTree();
            g._setTreeEven();
            g.set(p, false);
        },
        _setTreeLine: function (value)
        {
            if (value) this.tree.removeClass("l-tree-noline");
            else this.tree.addClass("l-tree-noline");
        },
        _setParms: function ()
        {
            var g = this, p = this.options;
            if ($.isFunction(p.parms)) p.parms = p.parms();
        },
        reload: function (callback)
        {
            var g = this, p = this.options;
            g.clear();
            g.loadData(null, p.url, null, {
                success: callback
            });
        },
        _setUrl: function (url)
        {
            var g = this, p = this.options;
            if (url)
            {
                g.clear();
                g.loadData(null, url);
            }
        },
        _setData: function (data)
        {
            if (data)
            {
                this.clear();
                this.append(null, data);
            }
        },
        setData: function (data)
        {
            this.set('data', data);
        },
        getData: function ()
        {
            return this.data;
        },
        //是否包含子节点
        hasChildren: function (treenodedata)
        {
            if (this.options.isLeaf) return !this.options.isLeaf(treenodedata);
            return treenodedata.children ? true : false;
        },
        //获取父节点 数据
        getParent: function (treenode, level)
        {
            var g = this;
            treenode = g.getNodeDom(treenode);
            var parentTreeNode = g.getParentTreeItem(treenode, level);
            if (!parentTreeNode) return null;
            var parentIndex = $(parentTreeNode).attr("treedataindex");
            return g._getDataNodeByTreeDataIndex(parentIndex);
        },
        //获取父节点
        getParentTreeItem: function (treenode, level)
        {
            var g = this;
            treenode = g.getNodeDom(treenode);
            var treeitem = $(treenode);
            if (treeitem.parent().hasClass("l-tree"))
                return null;
            if (level == undefined)
            {
                if (treeitem.parent().parent("li").length == 0)
                    return null;
                return treeitem.parent().parent("li")[0];
            }
            var currentLevel = parseInt(treeitem.attr("outlinelevel"));
            var currenttreeitem = treeitem;
            for (var i = currentLevel - 1; i >= level; i--)
            {
                currenttreeitem = currenttreeitem.parent().parent("li");
            }
            return currenttreeitem[0];
        },
        getChecked: function ()
        {
            var g = this, p = this.options;
            if (!this.options.checkbox) return null;
            var nodes = [];
            $(".l-checkbox-checked", g.tree).parent().parent("li").each(function ()
            {
                var treedataindex = parseInt($(this).attr("treedataindex"));
                nodes.push({ target: this, data: g._getDataNodeByTreeDataIndex(g.data, treedataindex) });
            });
            return nodes;
        },
        //add by superzoc 12/24/2012 
        refreshTree: function ()
        {
            var g = this, p = this.options;
            $.each(this.getChecked(), function (k, v)
            {
                g._setParentCheckboxStatus($(v.target));
            });
        },
        getSelected: function ()
        {
            var g = this, p = this.options;
            var node = {};
            node.target = $(".l-selected", g.tree).parent("li")[0];
            if (node.target)
            {
                var treedataindex = parseInt($(node.target).attr("treedataindex"));
                node.data = g._getDataNodeByTreeDataIndex(g.data, treedataindex);
                return node;
            }
            return null;
        },
        //升级为父节点级别
        upgrade: function (treeNode)
        {
            var g = this, p = this.options;
            $(".l-note", treeNode).each(function ()
            {
                $(this).removeClass("l-note").addClass("l-expandable-open");
            });
            $(".l-note-last", treeNode).each(function ()
            {
                $(this).removeClass("l-note-last").addClass("l-expandable-open");
            });
            $("." + g._getChildNodeClassName(), treeNode).each(function ()
            {
                $(this)
                        .removeClass(g._getChildNodeClassName())
                        .addClass(g._getParentNodeClassName(true));
            });
        },
        //降级为叶节点级别
        demotion: function (treeNode)
        {
            var g = this, p = this.options;
            if (!treeNode && treeNode[0].tagName.toLowerCase() != 'li') return;
            var islast = $(treeNode).hasClass("l-last");
            $(".l-expandable-open", treeNode).each(function ()
            {
                $(this).removeClass("l-expandable-open")
                        .addClass(islast ? "l-note-last" : "l-note");
            });
            $(".l-expandable-close", treeNode).each(function ()
            {
                $(this).removeClass("l-expandable-close")
                        .addClass(islast ? "l-note-last" : "l-note");
            });
            $("." + g._getParentNodeClassName(true), treeNode).each(function ()
            {
                $(this)
                        .removeClass(g._getParentNodeClassName(true))
                        .addClass(g._getChildNodeClassName());
            });
        },
        collapseAll: function ()
        {
            var g = this, p = this.options;
            $(".l-expandable-open", g.tree).click();
        },
        expandAll: function ()
        {
            var g = this, p = this.options;
            $(".l-expandable-close", g.tree).click();
        },
        loadData: function (node, url, param, e)
        {
            var g = this, p = this.options;
            e = $.extend({
                showLoading: function ()
                {
                    g.loading.show();
                },
                success: function () { },
                error: function () { },
                hideLoading: function ()
                {
                    g.loading.hide();
                }
            }, e || {});
            var ajaxtype = p.ajaxType;
            //解决树无法设置parms的问题
            param = $.extend(($.isFunction(p.parms) ? p.parms() : p.parms), param);
            //请求服务器
            $.ajax({
                type: ajaxtype,
                url: url,
                data: param,
                dataType: 'json',
                beforeSend: function ()
                {
                    e.showLoading();
                },
                success: function (data)
                {
                    if (!data) return;
                    e.hideLoading();
                    g.append(node, data);
                    g.trigger('success', [data]);
                    e.success(data);
                },
                error: function (XMLHttpRequest, textStatus, errorThrown)
                {
                    try
                    {
                        e.hideLoading();
                        g.trigger('error', [XMLHttpRequest, textStatus, errorThrown]);
                        e.error(XMLHttpRequest, textStatus, errorThrown);
                    }
                    catch (e)
                    {

                    }
                }
            });
        },
        //清空
        clear: function ()
        {
            var g = this, p = this.options;
            g.toggleNodeCallbacks = [];
            g.data = null;
            g.data = [];
            g.nodes = null;
            g.tree.html("");
        },
        //parm [treeNode] dom节点(li)、节点数据 或者节点 dataindex
        getNodeDom: function (nodeParm)
        {
            var g = this, p = this.options;
            if (nodeParm == null) return nodeParm;
            if (typeof (nodeParm) == "string" || typeof (nodeParm) == "number")
            {
                return $("li[treedataindex=" + nodeParm + "]", g.tree).get(0);
            }
            else if (typeof (nodeParm) == "object" && 'treedataindex' in nodeParm) //nodedata
            {
                return g.getNodeDom(nodeParm['treedataindex']);
            }
            return nodeParm;
        },
        hide: function (treeNode)
        {
            var g = this, p = this.options;
            treeNode = g.getNodeDom(treeNode);
            if (treeNode) $(treeNode).hide();
        },
        show: function (treeNode)
        {
            var g = this, p = this.options;
            treeNode = g.getNodeDom(treeNode);
            if (treeNode) $(treeNode).show();
        },
        //parm [treeNode] dom节点(li)、节点数据 或者节点 dataindex
        remove: function (treeNode)
        {
            var g = this, p = this.options;
            treeNode = g.getNodeDom(treeNode);
            var treedataindex = parseInt($(treeNode).attr("treedataindex"));
            var treenodedata = g._getDataNodeByTreeDataIndex(g.data, treedataindex);
            if (treenodedata) g._setTreeDataStatus([treenodedata], 'delete');
            var parentNode = g.getParentTreeItem(treeNode);
            //复选框处理
            if (p.checkbox)
            {
                g._setParentCheckboxStatus($(treeNode));
            }
            $(treeNode).remove();
            g._updateStyle(parentNode ? $("ul:first", parentNode) : g.tree);
        },
        _updateStyle: function (ul)
        {
            var g = this, p = this.options;
            var itmes = $(" > li", ul);
            var treeitemlength = itmes.length;
            if (!treeitemlength) return;
            //遍历设置子节点的样式
            itmes.each(function (i, item)
            {
                if (i == 0 && !$(this).hasClass("l-first"))
                    $(this).addClass("l-first");
                if (i == treeitemlength - 1 && !$(this).hasClass("l-last"))
                    $(this).addClass("l-last");
                if (i == 0 && i == treeitemlength - 1)
                    $(this).addClass("l-onlychild");
                $("> div .l-note,> div .l-note-last", this)
                           .removeClass("l-note l-note-last")
                           .addClass(i == treeitemlength - 1 ? "l-note-last" : "l-note");
                g._setTreeItem(this, { isLast: i == treeitemlength - 1 });
            });
        },
        //parm [domnode] dom节点(li)、节点数据 或者节点 dataindex
        update: function (domnode, newnodedata)
        {
            var g = this, p = this.options;
            domnode = g.getNodeDom(domnode);
            var treedataindex = parseInt($(domnode).attr("treedataindex"));
            nodedata = g._getDataNodeByTreeDataIndex(g.data, treedataindex);
            for (var attr in newnodedata)
            {
                nodedata[attr] = newnodedata[attr];
                if (attr == p.textFieldName)
                {
                    $("> .l-body > span", domnode).text(newnodedata[attr]);
                }
            }
        },
        //增加节点集合
        //parm [newdata] 数据集合 Array
        //parm [parentNode] dom节点(li)、节点数据 或者节点 dataindex
        //parm [nearNode] 附加到节点的上方/下方(非必填)
        //parm [isAfter] 附加到节点的下方(非必填)
        append: function (parentNode, newdata, nearNode, isAfter)
        {
            var g = this, p = this.options;
            parentNode = g.getNodeDom(parentNode);
            if (g.trigger('beforeAppend', [parentNode, newdata]) == false) return false;
            if (!newdata || !newdata.length) return false;
            if (p.idFieldName && p.parentIDFieldName)
                newdata = g.arrayToTree(newdata, p.idFieldName, p.parentIDFieldName);
            g._addTreeDataIndexToData(newdata);
            g._setTreeDataStatus(newdata, 'add');
            if (nearNode != null)
            {
                nearNode = g.getNodeDom(nearNode);
            }
            g.trigger('append', [parentNode, newdata])
            g._appendData(parentNode, newdata);
            if (parentNode == null)//增加到根节点
            {
                var gridhtmlarr = g._getTreeHTMLByData(newdata, 1, [], true);
                gridhtmlarr[gridhtmlarr.length - 1] = gridhtmlarr[0] = "";
                if (nearNode != null)
                {
                    $(nearNode)[isAfter ? 'after' : 'before'](gridhtmlarr.join(''));
                    g._updateStyle(parentNode ? $("ul:first", parentNode) : g.tree);
                }
                else
                {
                    //remove last node class
                    if ($("> li:last", g.tree).length > 0)
                        g._setTreeItem($("> li:last", g.tree)[0], { isLast: false });
                    g.tree.append(gridhtmlarr.join(''));
                }
                $(".l-body", g.tree).hover(function ()
                {
                    $(this).addClass("l-over");
                }, function ()
                {
                    $(this).removeClass("l-over");
                });
                g._upadteTreeWidth();
                g.trigger('afterAppend', [parentNode, newdata])
                return;
            }
            var treeitem = $(parentNode);
            var outlineLevel = parseInt(treeitem.attr("outlinelevel"));

            var hasChildren = $("> ul", treeitem).length > 0;
            if (!hasChildren)
            {
                treeitem.append("<ul class='l-children'></ul>");
                //设置为父节点
                g.upgrade(parentNode);
            }
            var isLast = [];
            for (var i = 1; i <= outlineLevel - 1; i++)
            {
                var currentParentTreeItem = $(g.getParentTreeItem(parentNode, i));
                isLast.push(currentParentTreeItem.hasClass("l-last"));
            }
            isLast.push(treeitem.hasClass("l-last"));
            var gridhtmlarr = g._getTreeHTMLByData(newdata, outlineLevel + 1, isLast, true);
            gridhtmlarr[gridhtmlarr.length - 1] = gridhtmlarr[0] = "";
            if (nearNode != null)
            {
                $(nearNode)[isAfter ? 'after' : 'before'](gridhtmlarr.join(''));
                g._updateStyle(parentNode ? $("ul:first", parentNode) : g.tree);
            }
            else
            {
                //remove last node class  
                if ($("> .l-children > li:last", treeitem).length > 0)
                    g._setTreeItem($("> .l-children > li:last", treeitem)[0], { isLast: false });
                $(">.l-children", parentNode).append(gridhtmlarr.join(''));
            }
            g._upadteTreeWidth();
            $(">.l-children .l-body", parentNode).hover(function ()
            {
                $(this).addClass("l-over");
            }, function ()
            {
                $(this).removeClass("l-over");
            });
            g.trigger('afterAppend', [parentNode, newdata]);
        },
        //parm [nodeParm] dom节点(li)、节点数据 或者节点 dataindex
        cancelSelect: function (nodeParm)
        {
            var g = this, p = this.options;
            var domNode = g.getNodeDom(nodeParm);
            var treeitem = $(domNode);
            var treedataindex = parseInt(treeitem.attr("treedataindex"));
            var treenodedata = g._getDataNodeByTreeDataIndex(g.data, treedataindex);
            var treeitembody = $(">div:first", treeitem);
            if (p.checkbox)
                $(".l-checkbox", treeitembody).removeClass("l-checkbox-checked").addClass("l-checkbox-unchecked");
            else
                treeitembody.removeClass("l-selected");
            g.trigger('cancelSelect', [{ data: treenodedata, target: treeitem[0] }]);
        },
        //选择节点(参数：条件函数、Dom节点或ID值)
        selectNode: function (selectNodeParm)
        {
            var g = this, p = this.options;
            var clause = null;
            if (typeof (selectNodeParm) == "function")
            {
                clause = selectNodeParm;
            }
            else if (typeof (selectNodeParm) == "object")
            {
                var treeitem = $(selectNodeParm);
                var treedataindex = parseInt(treeitem.attr("treedataindex"));
                var treenodedata = g._getDataNodeByTreeDataIndex(g.data, treedataindex);
                var treeitembody = $(">div:first", treeitem);
                if (!treeitembody.length)
                {
                    treeitembody = $("li[treedataindex=" + treedataindex + "] >div:first", g.tree);
                }
                if (p.checkbox)
                {
                    $(".l-checkbox", treeitembody).removeClass("l-checkbox-unchecked").addClass("l-checkbox-checked");
                }
                else
                {
                    $("div.l-selected", g.tree).removeClass("l-selected");
                    treeitembody.addClass("l-selected");
                }
                g.trigger('select', [{ data: treenodedata, target: treeitembody.parent().get(0) }]);
                return;
            }
            else
            {
                clause = function (data)
                {
                    if (!data[p.idFieldName]) return false;
                    return strTrim(data[p.idFieldName].toString()) == strTrim(selectNodeParm.toString());
                };
            }
            $("li", g.tree).each(function ()
            {
                var treeitem = $(this);
                var treedataindex = parseInt(treeitem.attr("treedataindex"));
                var treenodedata = g._getDataNodeByTreeDataIndex(g.data, treedataindex);
                if (clause(treenodedata, treedataindex))
                {
                    g.selectNode(this);
                }
                else
                {
                    //修复多选checkbox为true时调用该方法会取消已经选中节点的问题
                    if (!g.options.checkbox)
                    {
                        g.cancelSelect(this);
                    }
                }
            });
        },
        getTextByID: function (id)
        {
            var g = this, p = this.options;
            var data = g.getDataByID(id);
            if (!data) return null;
            return data[p.textFieldName];
        },
        getDataByID: function (id)
        {
            var g = this, p = this.options;
            var data = null;
            $("li", g.tree).each(function ()
            {
                if (data) return;
                var treeitem = $(this);
                var treedataindex = parseInt(treeitem.attr("treedataindex"));
                var treenodedata = g._getDataNodeByTreeDataIndex(g.data, treedataindex);
                if (treenodedata[p.idFieldName].toString() == id.toString())
                {
                    data = treenodedata;
                }
            });
            return data;
        },
        arrayToTree: function (data, id, pid)      //将ID、ParentID这种数据格式转换为树格式
        {
            if (!data || !data.length) return [];
            var targetData = [];                    //存储数据的容器(返回) 
            var records = {};
            var itemLength = data.length;           //数据集合的个数
            for (var i = 0; i < itemLength; i++)
            {
                var o = data[i];
                records[o[id]] = o;
            }
            for (var i = 0; i < itemLength; i++)
            {
                var currentData = data[i];
                var parentData = records[currentData[pid]];
                if (!parentData)
                {
                    targetData.push(currentData);
                    continue;
                }
                parentData.children = parentData.children || [];
                parentData.children.push(currentData);
            }
            return targetData;
        },
        //根据数据索引获取数据
        _getDataNodeByTreeDataIndex: function (data, treedataindex)
        {
            var g = this, p = this.options;
            for (var i = 0; i < data.length; i++)
            {
                if (data[i].treedataindex == treedataindex)
                    return data[i];
                if (data[i].children)
                {
                    var targetData = g._getDataNodeByTreeDataIndex(data[i].children, treedataindex);
                    if (targetData) return targetData;
                }
            }
            return null;
        },
        //设置数据状态
        _setTreeDataStatus: function (data, status)
        {
            var g = this, p = this.options;
            $(data).each(function ()
            {
                this[p.statusName] = status;
                if (this.children)
                {
                    g._setTreeDataStatus(this.children, status);
                }
            });
        },
        //设置data 索引
        _addTreeDataIndexToData: function (data)
        {
            var g = this, p = this.options;
            $(data).each(function ()
            {
                if (this.treedataindex != undefined) return;
                this.treedataindex = g.treedataindex++;
                if (this.children)
                {
                    g._addTreeDataIndexToData(this.children);
                }
            });
        },
        _addToNodes: function (data)
        {
            var g = this, p = this.options;
            g.nodes = g.nodes || [];
            g.nodes.push(data);
            if (!data.children) return;
            $(data.children).each(function (i, item)
            {
                g._addToNodes(item);
            });
        },
        //添加项到g.data
        _appendData: function (treeNode, data)
        {
            var g = this, p = this.options;
            var treedataindex = parseInt($(treeNode).attr("treedataindex"));
            var treenodedata = g._getDataNodeByTreeDataIndex(g.data, treedataindex);
            if (g.treedataindex == undefined) g.treedataindex = 0;
            if (treenodedata && treenodedata.children == undefined) treenodedata.children = [];
            $(data).each(function (i, item)
            {
                if (treenodedata)
                    treenodedata.children[treenodedata.children.length] = item;
                else
                    g.data[g.data.length] = item;
                g._addToNodes(item);
            });
        },
        _setTreeItem: function (treeNode, options)
        {
            var g = this, p = this.options;
            if (!options) return;
            treeNode = g.getNodeDom(treeNode);
            var treeItem = $(treeNode);
            var outlineLevel = parseInt(treeItem.attr("outlinelevel"));
            if (options.isLast != undefined)
            {
                if (options.isLast == true)
                {
                    treeItem.removeClass("l-last").addClass("l-last");
                    $("> div .l-note", treeItem).removeClass("l-note").addClass("l-note-last");
                    $(".l-children li", treeItem)
                            .find(".l-box:eq(" + (outlineLevel - 1) + ")")
                            .removeClass("l-line");
                }
                else if (options.isLast == false)
                {
                    treeItem.removeClass("l-last");
                    $("> div .l-note-last", treeItem).removeClass("l-note-last").addClass("l-note");

                    $(".l-children li", treeItem)
                            .find(".l-box:eq(" + (outlineLevel - 1) + ")")
                            .removeClass("l-line")
                            .addClass("l-line");
                }
            }
        },
        _upadteTreeWidth: function ()
        {
            var g = this, p = this.options;
            var treeWidth = g.maxOutlineLevel * 22;
            if (p.checkbox) treeWidth += 22;
            if (p.parentIcon || p.childIcon) treeWidth += 22;
            treeWidth += p.nodeWidth;
            g.tree.width(treeWidth);
        },
        _getChildNodeClassName: function ()
        {
            var g = this, p = this.options;
            return 'l-tree-icon-' + p.childIcon;
        },
        _getParentNodeClassName: function (isOpen)
        {
            var g = this, p = this.options;
            var nodeclassname = 'l-tree-icon-' + p.parentIcon;
            if (isOpen) nodeclassname += '-open';
            return nodeclassname;
        },
        //判断节点是否展开状态,返回true/false
        _isExpand: function (o, level)
        {
            var g = this, p = this.options;
            var isExpand = o.isExpand != null ? o.isExpand : (o.isexpand != null ? o.isexpand : p.isExpand);
            if (isExpand == null) return true;
            if (typeof (isExpand) == "function") isExpand = p.isExpand({ data: o, level: level });
            if (typeof (isExpand) == "boolean") return isExpand;
            if (typeof (isExpand) == "string") return isExpand == "true";
            if (typeof (isExpand) == "number") return isExpand > level;
            return true;
        },
        //获取节点的延迟加载状态,返回true/false (本地模式) 或者是object({url :'...',parms:null})(远程模式)
        _getDelay: function (o, level)
        {
            var g = this, p = this.options;
            var delay = o.delay != null ? o.delay : p.delay;
            if (delay == null) return false;
            if (typeof (delay) == "function") delay = delay({ data: o, level: level });
            if (typeof (delay) == "boolean") return delay;
            if (typeof (delay) == "string") return { url: delay };
            if (typeof (delay) == "number") delay = [delay];
            if ($.isArray(delay)) return $.inArray(level, delay) != -1;
            if (typeof (delay) == "object" && delay.url) return delay;
            return false;
        },
        //根据data生成最终完整的tree html
        _getTreeHTMLByData: function (data, outlineLevel, isLast, isExpand)
        {
            var g = this, p = this.options;
            if (g.maxOutlineLevel < outlineLevel)
                g.maxOutlineLevel = outlineLevel;
            isLast = isLast || [];
            outlineLevel = outlineLevel || 1;
            var treehtmlarr = [];
            if (!isExpand) treehtmlarr.push('<ul class="l-children" style="display:none">');
            else treehtmlarr.push("<ul class='l-children'>");
            for (var i = 0; i < data.length; i++)
            {
                var o = data[i];
                var isFirst = i == 0;
                var isLastCurrent = i == data.length - 1;
                var delay = g._getDelay(o, outlineLevel);
                var isExpandCurrent = delay ? false : g._isExpand(o, outlineLevel);

                treehtmlarr.push('<li ');
                if (o.treedataindex != undefined)
                    treehtmlarr.push('treedataindex="' + o.treedataindex + '" ');
                if (isExpandCurrent)
                    treehtmlarr.push('isexpand=' + o.isexpand + ' ');
                treehtmlarr.push('outlinelevel=' + outlineLevel + ' ');
                //增加属性支持
                for (var j = 0; j < g.sysAttribute.length; j++)
                {
                    if ($(this).attr(g.sysAttribute[j]))
                        data[dataindex][g.sysAttribute[j]] = $(this).attr(g.sysAttribute[j]);
                }
                for (var j = 0; j < p.attribute.length; j++)
                {
                    if (o[p.attribute[j]])
                        treehtmlarr.push(p.attribute[j] + '="' + o[p.attribute[j]] + '" ');
                }

                //css class
                treehtmlarr.push('class="');
                isFirst && treehtmlarr.push('l-first ');
                isLastCurrent && treehtmlarr.push('l-last ');
                isFirst && isLastCurrent && treehtmlarr.push('l-onlychild ');
                treehtmlarr.push('"');
                treehtmlarr.push('>');
                treehtmlarr.push('<div class="l-body ');
                if(o.cls) {
                	treehtmlarr.push (o.cls);
                }
                if (p.selectable && p.selectable(o) == false)
                {
                    treehtmlarr.push(' l-unselectable');
                }
                treehtmlarr.push('">');
                for (var k = 0; k <= outlineLevel - 2; k++)
                {
                    if (isLast[k]) treehtmlarr.push('<div class="l-box"></div>');
                    else treehtmlarr.push('<div class="l-box l-line"></div>');
                }
                if (g.hasChildren(o))
                {
                    if (isExpandCurrent) treehtmlarr.push('<div class="l-box l-expandable-open"></div>');
                    else treehtmlarr.push('<div class="l-box l-expandable-close"></div>');
                    if (p.checkbox&&p.parentsCheckbox)
                    {
                        if (o.ischecked)
                            treehtmlarr.push('<div class="l-box l-checkbox l-checkbox-checked"></div>');
                        else
                            treehtmlarr.push('<div class="l-box l-checkbox l-checkbox-unchecked"></div>');
                    }
                    if (p.parentIcon)
                    {
                        //node icon
                        treehtmlarr.push('<div class="l-box l-tree-icon ');
                        treehtmlarr.push(g._getParentNodeClassName(isExpandCurrent ? true : false) + " ");
                        if (p.iconFieldName && o[p.iconFieldName])
                            treehtmlarr.push('l-tree-icon-none');
                        treehtmlarr.push('">');
                        if (p.iconFieldName && o[p.iconFieldName])
                            treehtmlarr.push('<img src="' + o[p.iconFieldName] + '" />');
                        treehtmlarr.push('</div>');
                    }
                }
                else
                {
                    if (isLastCurrent) treehtmlarr.push('<div class="l-box l-note-last"></div>');
                    else treehtmlarr.push('<div class="l-box l-note"></div>');
                    if (p.checkbox)
                    {
                        if (o.ischecked)
                            treehtmlarr.push('<div class="l-box l-checkbox l-checkbox-checked"></div>');
                        else
                            treehtmlarr.push('<div class="l-box l-checkbox l-checkbox-unchecked"></div>');
                    }
                    if (p.childIcon)
                    {
                        //node icon 
                        treehtmlarr.push('<div class="l-box l-tree-icon ');
                        treehtmlarr.push(g._getChildNodeClassName() + " ");
                        if (p.iconFieldName && o[p.iconFieldName])
                            treehtmlarr.push('l-tree-icon-none');
                        treehtmlarr.push('">');
                        if (p.iconFieldName && o[p.iconFieldName])
                            treehtmlarr.push('<img src="' + o[p.iconFieldName] + '" />');
                        treehtmlarr.push('</div>');
                    }
                }
                if (p.render)
                {
                    treehtmlarr.push('<span>' + p.render(o, o[p.textFieldName]) + '</span>');
                } else
                {
                    treehtmlarr.push('<span>' + o[p.textFieldName] + '</span>');
                }
                treehtmlarr.push('</div>');
                if (g.hasChildren(o))
                {
                    var isLastNew = [];
                    for (var k = 0; k < isLast.length; k++)
                    {
                        isLastNew.push(isLast[k]);
                    }
                    isLastNew.push(isLastCurrent);
                    if (delay)
                    {
                        if (delay == true)
                        {
                            g.toggleNodeCallbacks.push({
                                data: o,
                                callback: function (dom, o)
                                {
                                    var content = g._getTreeHTMLByData(o.children, outlineLevel + 1, isLastNew, isExpandCurrent).join('');
                                    $(dom).append(content);
                                    $(">.l-children .l-body", dom).hover(function ()
                                    {
                                        $(this).addClass("l-over");
                                    }, function ()
                                    {
                                        $(this).removeClass("l-over");
                                    });
                                    g._removeToggleNodeCallback(o);
                                }
                            });
                        }
                        else if (delay.url)
                        {
                            (function (o, url, parms)
                            {
                                g.toggleNodeCallbacks.push({
                                    data: o,
                                    callback: function (dom, o)
                                    {
                                        g.loadData(dom, url, parms, {
                                            showLoading: function ()
                                            {
                                                $("div.l-expandable-close:first", dom).addClass("l-box-loading");
                                            },
                                            hideLoading: function ()
                                            {
                                                $("div.l-box-loading:first", dom).removeClass("l-box-loading");
                                            }
                                        });
                                        g._removeToggleNodeCallback(o);
                                    }
                                });
                            })(o, delay.url, delay.parms);
                        }
                    }
                    else
                    {
                        treehtmlarr.push(g._getTreeHTMLByData(o.children, outlineLevel + 1, isLastNew, isExpandCurrent).join(''));
                    }

                }
                treehtmlarr.push('</li>');
            }
            treehtmlarr.push("</ul>");
            return treehtmlarr;

        },
        _removeToggleNodeCallback: function (nodeData)
        {
            var g = this, p = this.options;
            for (var i = 0; i <= g.toggleNodeCallbacks.length; i++)
            {
                if (g.toggleNodeCallbacks[i] && g.toggleNodeCallbacks[i].data == nodeData)
                {
                    g.toggleNodeCallbacks.splice(i, 1);
                    break;
                }
            }
        },
        //根据简洁的html获取data
        _getDataByTreeHTML: function (treeDom)
        {
            var g = this, p = this.options;
            var data = [];
            $("> li", treeDom).each(function (i, item)
            {
                var dataindex = data.length;
                data[dataindex] =
                        {
                            treedataindex: g.treedataindex++
                        };
                data[dataindex][p.textFieldName] = $("> span,> a", this).html();
                for (var j = 0; j < g.sysAttribute.length; j++)
                {
                    if ($(this).attr(g.sysAttribute[j]))
                        data[dataindex][g.sysAttribute[j]] = $(this).attr(g.sysAttribute[j]);
                }
                for (var j = 0; j < p.attribute.length; j++)
                {
                    if ($(this).attr(p.attribute[j]))
                        data[dataindex][p.attribute[j]] = $(this).attr(p.attribute[j]);
                }
                if ($("> ul", this).length > 0)
                {
                    data[dataindex].children = g._getDataByTreeHTML($("> ul", this));
                }
            });
            return data;
        },
        _applyTree: function ()
        {
            var g = this, p = this.options;
            g.data = g._getDataByTreeHTML(g.tree);
            var gridhtmlarr = g._getTreeHTMLByData(g.data, 1, [], true);
            gridhtmlarr[gridhtmlarr.length - 1] = gridhtmlarr[0] = "";
            g.tree.html(gridhtmlarr.join(''));
            g._upadteTreeWidth();
            $(".l-body", g.tree).hover(function ()
            {
                $(this).addClass("l-over");
            }, function ()
            {
                $(this).removeClass("l-over");
            });
        },
        _getSrcElementByEvent: function (e)
        {
            var g = this;
            var obj = (e.target || e.srcElement);
            var tag = obj.tagName.toLowerCase();
            var jobjs = $(obj).parents().add(obj);
            var fn = function (parm)
            {
                for (var i = jobjs.length - 1; i >= 0; i--)
                {
                    if ($(jobjs[i]).hasClass(parm)) return jobjs[i];
                }
                return null;
            };
            if (jobjs.index(this.element) == -1) return { out: true };
            var r = {
                tree: fn("l-tree"),
                node: fn("l-body"),
                checkbox: fn("l-checkbox"),
                icon: fn("l-tree-icon"),
                text: tag == "span",
                cls:null
            };
            if (r.node)
            {
                var treedataindex = parseInt($(r.node).parent().attr("treedataindex"));
                r.data = g._getDataNodeByTreeDataIndex(g.data, treedataindex);
            }
            return r;
        },
        _setTreeEven: function ()
        {
            var g = this, p = this.options;
            if (g.hasBind('contextmenu'))
            {
                g.tree.bind("contextmenu", function (e)
                {
                    var obj = (e.target || e.srcElement);
                    var treeitem = null;
                    if (obj.tagName.toLowerCase() == "a" || obj.tagName.toLowerCase() == "span" || $(obj).hasClass("l-box"))
                        treeitem = $(obj).parent().parent();
                    else if ($(obj).hasClass("l-body"))
                        treeitem = $(obj).parent();
                    else if (obj.tagName.toLowerCase() == "li")
                        treeitem = $(obj);
                    if (!treeitem) return;
                    var treedataindex = parseInt(treeitem.attr("treedataindex"));
                    var treenodedata = g._getDataNodeByTreeDataIndex(g.data, treedataindex);
                    return g.trigger('contextmenu', [{ data: treenodedata, target: treeitem[0] }, e]);
                });
            }
            g.tree.click(function (e)
            {
                var obj = (e.target || e.srcElement);
                var treeitem = null;
                if (obj.tagName.toLowerCase() == "a" || obj.tagName.toLowerCase() == "span" || $(obj).hasClass("l-box"))
                    treeitem = $(obj).parent().parent();
                else if ($(obj).hasClass("l-body"))
                    treeitem = $(obj).parent();
                else
                    treeitem = $(obj);
                if (!treeitem) return;
                var treedataindex = parseInt(treeitem.attr("treedataindex"));
                var treenodedata = g._getDataNodeByTreeDataIndex(g.data, treedataindex);
                var treeitembtn = $("div.l-body:first", treeitem).find("div.l-expandable-open:first,div.l-expandable-close:first");
                var clickOnTreeItemBtn = $(obj).hasClass("l-expandable-open") || $(obj).hasClass("l-expandable-close");
                if (!$(obj).hasClass("l-checkbox") && !clickOnTreeItemBtn)
                {
                    if (!treeitem.hasClass("l-unselectable"))
                    {
                        if ($(">div:first", treeitem).hasClass("l-selected") && p.needCancel)
                        {
                            if (g.trigger('beforeCancelSelect', [{ data: treenodedata, target: treeitem[0] }]) == false)
                                return false;

                            $(">div:first", treeitem).removeClass("l-selected");
                            g.trigger('cancelSelect', [{ data: treenodedata, target: treeitem[0] }]);
                        }
                        else
                        {
                            if (g.trigger('beforeSelect', [{ data: treenodedata, target: treeitem[0] }]) == false)
                                return false;
                            $(".l-body", g.tree).removeClass("l-selected");
                            $(">div:first", treeitem).addClass("l-selected");
                            g.trigger('select', [{ data: treenodedata, target: treeitem[0] }])
                        }
                        
                    }
                }
                //chekcbox even
                if ($(obj).hasClass("l-checkbox"))
                {
                    if (p.autoCheckboxEven)
                    {
                        //状态：未选中
                        if ($(obj).hasClass("l-checkbox-unchecked"))
                        {
                            $(obj).removeClass("l-checkbox-unchecked").addClass("l-checkbox-checked");
                            $(".l-children .l-checkbox", treeitem)
                                    .removeClass("l-checkbox-incomplete l-checkbox-unchecked")
                                    .addClass("l-checkbox-checked");
                            g.trigger('check', [{ data: treenodedata, target: treeitem[0] }, true]);
                        }
                            //状态：选中
                        else if ($(obj).hasClass("l-checkbox-checked"))
                        {
                            $(obj).removeClass("l-checkbox-checked").addClass("l-checkbox-unchecked");
                            $(".l-children .l-checkbox", treeitem)
                                    .removeClass("l-checkbox-incomplete l-checkbox-checked")
                                    .addClass("l-checkbox-unchecked");
                            g.trigger('check', [{ data: treenodedata, target: treeitem[0] }, false]);
                        }
                            //状态：未完全选中
                        else if ($(obj).hasClass("l-checkbox-incomplete"))
                        {
                            $(obj).removeClass("l-checkbox-incomplete").addClass("l-checkbox-checked");
                            $(".l-children .l-checkbox", treeitem)
                                    .removeClass("l-checkbox-incomplete l-checkbox-unchecked")
                                    .addClass("l-checkbox-checked");
                            g.trigger('check', [{ data: treenodedata, target: treeitem[0] }, true]);
                        }
                        g._setParentCheckboxStatus(treeitem);
                    }
                    else
                    {
                        //状态：未选中
                        if ($(obj).hasClass("l-checkbox-unchecked"))
                        {
                            $(obj).removeClass("l-checkbox-unchecked").addClass("l-checkbox-checked");
                            //是否单选
                            if (p.single)
                            {
                                $(".l-checkbox", g.tree).not(obj).removeClass("l-checkbox-checked").addClass("l-checkbox-unchecked");
                            }
                            g.trigger('check', [{ data: treenodedata, target: treeitem[0] }, true]);
                        }
                            //状态：选中
                        else if ($(obj).hasClass("l-checkbox-checked"))
                        {
                            $(obj).removeClass("l-checkbox-checked").addClass("l-checkbox-unchecked");
                            g.trigger('check', [{ data: treenodedata, target: treeitem[0] }, false]);
                        }
                    }
                }
                    //状态：已经张开
                else if (treeitembtn.hasClass("l-expandable-open") && (!p.btnClickToToggleOnly || clickOnTreeItemBtn))
                {
                    if (g.trigger('beforeCollapse', [{ data: treenodedata, target: treeitem[0] }]) == false)
                        return false;
                    treeitembtn.removeClass("l-expandable-open").addClass("l-expandable-close");
                    if (p.slide)
                        $("> .l-children", treeitem).slideToggle('fast');
                    else
                        $("> .l-children", treeitem).hide();
                    $("> div ." + g._getParentNodeClassName(true), treeitem)
                            .removeClass(g._getParentNodeClassName(true))
                            .addClass(g._getParentNodeClassName());
                    g.trigger('collapse', [{ data: treenodedata, target: treeitem[0] }]);
                }
                    //状态：没有张开
                else if (treeitembtn.hasClass("l-expandable-close") && (!p.btnClickToToggleOnly || clickOnTreeItemBtn))
                {
                    if (g.trigger('beforeExpand', [{ data: treenodedata, target: treeitem[0] }]) == false)
                        return false;

                    $(g.toggleNodeCallbacks).each(function ()
                    {
                        if (this.data == treenodedata)
                        {
                            this.callback(treeitem[0], treenodedata);
                        }
                    });
                    treeitembtn.removeClass("l-expandable-close").addClass("l-expandable-open");
                    var callback = function ()
                    {
                        g.trigger('expand', [{ data: treenodedata, target: treeitem[0] }]);
                    };
                    if (p.slide)
                    {
                        $("> .l-children", treeitem).slideToggle('fast', callback);
                    }
                    else
                    {
                        $("> .l-children", treeitem).show();
                        callback();
                    }
                    $("> div ." + g._getParentNodeClassName(), treeitem)
                            .removeClass(g._getParentNodeClassName())
                            .addClass(g._getParentNodeClassName(true));
                }
                g.trigger('click', [{ data: treenodedata, target: treeitem[0] }]);
            });

            //节点拖拽支持
            if ($.fn.zoeDrag && p.nodeDraggable)
            {
                g.nodeDroptip = $("<div class='l-drag-nodedroptip' style='display:none'></div>").appendTo('body');
                g.tree.zoeDrag({
                    revert: true, animate: false,
                    proxyX: 20, proxyY: 20,
                    proxy: function (draggable, e)
                    {
                        var src = g._getSrcElementByEvent(e);
                        if (src.node)
                        {
                            var content = "dragging";
                            if (p.nodeDraggingRender)
                            {
                                content = p.nodeDraggingRender(draggable.draggingNodes, draggable, g);
                            }
                            else
                            {
                                content = "";
                                var appended = false;
                                for (var i in draggable.draggingNodes)
                                {
                                    var node = draggable.draggingNodes[i];
                                    if (appended) content += ",";
                                    content += node.text;
                                    appended = true;
                                }
                            }
                            var proxy = $("<div class='l-drag-proxy' style='display:none'><div class='l-drop-icon l-drop-no'></div>" + content + "</div>").appendTo('body');
                            return proxy;
                        }
                    },
                    onRevert: function () { return false; },
                    onRendered: function ()
                    {
                        this.set('cursor', 'default');
                        g.children[this.id] = this;
                    },
                    onStartDrag: function (current, e)
                    {
                        if (e.button == 2) return false;
                        this.set('cursor', 'default');
                        var src = g._getSrcElementByEvent(e);
                        if (src.checkbox) return false;
                        if (p.checkbox)
                        {
                            var checked = g.getChecked();
                            this.draggingNodes = [];
                            for (var i in checked)
                            {
                                this.draggingNodes.push(checked[i].data);
                            }
                            if (!this.draggingNodes || !this.draggingNodes.length) return false;
                        }
                        else
                        {
                            this.draggingNodes = [src.data];
                        }
                        this.draggingNode = src.data;
                        this.set('cursor', 'move');
                        g.nodedragging = true;
                        this.validRange = {
                            top: g.tree.offset().top,
                            bottom: g.tree.offset().top + g.tree.height(),
                            left: g.tree.offset().left,
                            right: g.tree.offset().left + g.tree.width()
                        };
                    },
                    onDrag: function (current, e)
                    {
                        var nodedata = this.draggingNode;
                        if (!nodedata) return false;
                        var nodes = this.draggingNodes ? this.draggingNodes : [nodedata];
                        if (g.nodeDropIn == null) g.nodeDropIn = -1;
                        var pageX = e.pageX;
                        var pageY = e.pageY;
                        var visit = false;
                        var validRange = this.validRange;
                        if (pageX < validRange.left || pageX > validRange.right
                            || pageY > validRange.bottom || pageY < validRange.top)
                        {

                            g.nodeDropIn = -1;
                            g.nodeDroptip.hide();
                            this.proxy.find(".l-drop-icon:first").removeClass("l-drop-yes l-drop-add").addClass("l-drop-no");
                            return;
                        }
                        for (var i = 0, l = g.nodes.length; i < l; i++)
                        {
                            var nd = g.nodes[i];
                            var treedataindex = nd['treedataindex'];
                            if (nodedata['treedataindex'] == treedataindex) visit = true;
                            if ($.inArray(nd, nodes) != -1) continue;
                            var isAfter = visit ? true : false;
                            if (g.nodeDropIn != -1 && g.nodeDropIn != treedataindex) continue;
                            var jnode = $("li[treedataindex=" + treedataindex + "] div:first", g.tree);
                            var offset = jnode.offset();
                            var range = {
                                top: offset.top,
                                bottom: offset.top + jnode.height(),
                                left: g.tree.offset().left,
                                right: g.tree.offset().left + g.tree.width()
                            };
                            if (pageX > range.left && pageX < range.right && pageY > range.top && pageY < range.bottom)
                            {
                                var lineTop = offset.top;
                                if (isAfter) lineTop += jnode.height();
                                g.nodeDroptip.css({
                                    left: range.left,
                                    top: lineTop,
                                    width: range.right - range.left
                                }).show();
                                g.nodeDropIn = treedataindex;
                                g.nodeDropDir = isAfter ? "bottom" : "top";
                                if (pageY > range.top + 7 && pageY < range.bottom - 7)
                                {
                                    this.proxy.find(".l-drop-icon:first").removeClass("l-drop-no l-drop-yes").addClass("l-drop-add");
                                    g.nodeDroptip.hide();
                                    g.nodeDropInParent = true;
                                }
                                else
                                {
                                    this.proxy.find(".l-drop-icon:first").removeClass("l-drop-no l-drop-add").addClass("l-drop-yes");
                                    g.nodeDroptip.show();
                                    g.nodeDropInParent = false;
                                }
                                break;
                            }
                            else if (g.nodeDropIn != -1)
                            {
                                g.nodeDropIn = -1;
                                g.nodeDropInParent = false;
                                g.nodeDroptip.hide();
                                this.proxy.find(".l-drop-icon:first").removeClass("l-drop-yes  l-drop-add").addClass("l-drop-no");
                            }
                        }
                    },
                    onStopDrag: function (current, e)
                    {
                        var nodes = this.draggingNodes;
                        g.nodedragging = false;
                        if (g.nodeDropIn != -1)
                        {
                            for (var i = 0; i < nodes.length; i++)
                            {
                                var children = nodes[i].children;
                                if (children)
                                {
                                    nodes = $.grep(nodes, function (node, i)
                                    {
                                        var isIn = $.inArray(node, children) == -1;
                                        return isIn;
                                    });
                                }
                            }
                            for (var i in nodes)
                            {
                                var node = nodes[i];
                                if (g.nodeDropInParent)
                                {
                                    g.remove(node);
                                    g.append(g.nodeDropIn, [node]);
                                }
                                else
                                {
                                    g.remove(node);
                                    g.append(g.getParent(g.nodeDropIn), [node], g.nodeDropIn, g.nodeDropDir == "bottom")
                                }
                            }
                            g.nodeDropIn = -1;
                        }
                        g.nodeDroptip.hide();
                        this.set('cursor', 'default');
                    }
                });
            }
        },
        //递归设置父节点的状态
        _setParentCheckboxStatus: function (treeitem)
        {
            var g = this, p = this.options;
            //当前同级别或低级别的节点是否都选中了
            var isCheckedComplete = $(".l-checkbox-unchecked", treeitem.parent()).length == 0;
            //当前同级别或低级别的节点是否都没有选中
            var isCheckedNull = $(".l-checkbox-checked", treeitem.parent()).length == 0;
            if (isCheckedComplete)
            {
                treeitem.parent().prev().find(".l-checkbox")
                                    .removeClass("l-checkbox-unchecked l-checkbox-incomplete")
                                    .addClass("l-checkbox-checked");
            }
            else if (isCheckedNull)
            {
                treeitem.parent().prev().find("> .l-checkbox")
                                    .removeClass("l-checkbox-checked l-checkbox-incomplete")
                                    .addClass("l-checkbox-unchecked");
            }
            else
            {
                treeitem.parent().prev().find("> .l-checkbox")
                                    .removeClass("l-checkbox-unchecked l-checkbox-checked")
                                    .addClass("l-checkbox-incomplete");
            }
            if (treeitem.parent().parent("li").length > 0)
                g._setParentCheckboxStatus(treeitem.parent().parent("li"));
        }
    });



    function strTrim(str)
    {
        if (!str) return str;
        return str.replace(/(^\s*)|(\s*$)/g, '');
    };

})(jQuery);﻿




/**
* jQuery zoeUI
Form

* 
*/
(function ($)
{

    $.fn.zoeForm = function ()
    {
        return $.zoeui.run.call(this, "zoeForm", arguments);
    };

    $.zoeui.getConditions = function (form, options)
    {
        if (!form) return null;
        form = zoe.get($(form));
        if (form && form.toConditions) return form.toConditions();
    };

    $.zoeDefaults = $.zoeDefaults || {};
    $.zoeDefaults.Form = {
        width: null,    // 表单的宽度
        //控件宽度
        inputWidth: 180,
        //标签宽度
        labelWidth: 90,
        //间隔宽度
        space: 40,
        rightToken: '：',
        //标签对齐方式
        labelAlign: 'right',
        //控件对齐方式
        align: 'left',
        //字段
        /*
        数组的集合,支持的类型包括在$.zoeDefaults.Form.editors,这个editors同Grid的editors继承于base.js中提供的编辑器集合,具体可以看zoe.editors
        字段的参数参考 127行左右的 $.zoeDefaults.Form_fields,
        ui内置的编辑表单元素都会调用ui的表单插件集合,所以这些字段都有属于自己的"zoe对象",可以同zoe.get("[ID]")的方式获取，这里的[ID]获取方式优先级如下：
        1,定义了field.id 则取field.id 
        2,如果是下拉框和PopupEdit，并且定义了comboboxName，则取comboboxName(如果表单定义了prefixID,需要加上)
        3,默认取field.name(如果表单定义了prefixID,需要加上) 
        */
        fields: [],
        //创建的表单元素是否附加ID
        appendID: true,
        //生成表单元素ID、Name的前缀
        prefixID: null,
        //json解析函数
        toJSON: $.zoeui.toJSON,
        labelCss: null,
        fieldCss: null,
        spaceCss: null,
        onAfterSetFields: null,
        // 参数同 zoeButton
        buttons: null,              //按钮组
        readonly: false,              //是否只读
        editors: {},              //编辑器集合,使用同$.zoeDefaults.Grid.editors
        //验证
        validate: null,
        //不设置validate属性到inuput
        unSetValidateAttr: false,
        tab: null
    };

    $.zoeDefaults.FormString = {
        invalidMessage: '存在{errorCount}个字段验证不通过，请检查!',
        detailMessage: '详细',
        okMessage: '确定'
    };

    $.zoeDefaults.Form.editors.textarea =
    {
        create: function (container, editParm, p)
        {
            var editor = $('<textarea class="l-textarea" />');
            var id = (p.prefixID || "") + editParm.field.name;
            if ($("#" + id).length)
            {
                editor = $("#" + id);
            }
            editor.attr({
                id: id,
                name: id
            });
            if (p.readonly) editor.attr("readonly", true);
            container.append(editor);
            return editor;
        },
        getValue: function (editor, editParm)
        {
            return editor.val();
        },
        setValue: function (editor, value, editParm)
        {
            editor.val(value);
        },
        resize: function (editor, width, height, editParm)
        {
            editor.css({
                width: width - 2
            }).parent().css("width", "auto");
        }
    };

    $.zoeDefaults.Form.editors.hidden =
    {
        create: function (container, editParm, p)
        {
            var editor = $('<input type = "hidden"  />');
            var id = (p.prefixID || "") + editParm.field.name;
            // 单个页面 多个form表单不能有同名hidden对象
            // if ($("#" + id).length)
            // {
            //     editor = $("#" + id);
            // }
            //添加options.attr属性的设置
            editor.attr($.extend({
                id: id,
                name: id
            }, editParm.field.attr));
            //添加设置初始化值options.value的设置
            if (editParm.field.options && editParm.field.options.value)
            {
                editor.val(editParm.field.options.value);
            }
            container.append(editor);
            return editor;
        },
        getValue: function (editor, editParm)
        {
            return editor.val();
        },
        setValue: function (editor, value, editParm)
        {
            editor.val(value);
        }
    };

    $.zoeDefaults.Form_fields = {
        name: null,             //字段name
        textField: null,       //文本框name
        type: null,             //表单类型
        editor: null,           //编辑器扩展类型
        label: null,            //Label
        hideSpace: false,
        hideLabel: false,
        rightToken: null,      // ： 
        newline: true,          //换行显示
        op: null,               //操作符 附加到input
        vt: null,               //值类型 附加到input
        attr: null,             //属性列表 附加到input
        validate: null          //验证参数，比如required:true
    };

    $.zoeDefaults.Form_editor = {
    };

    //description 自动创建zoeui风格的表单-编辑器构造函数
    //editorBulider -> editorBuilder 命名错误 
    //param {jinput} 表单元素jQuery对象 比如input、select、textarea 
    $.zoeDefaults.Form.editorBulider = function (jinput)
    {
        //这里this就是form的zoeui对象
        var g = this, p = this.options;
        var options = {}, ltype = jinput.attr("ltype"), field = {};
        if (p.readonly) options.readonly = true;
        options = $.extend({
            width: (field.width || p.inputWidth) - 2
        }, field.options, field.editor, options);
        if (ltype == "autocomplete")
            options.autocomplete = true;
        if (jinput.is("select"))
        {
            jinput.zoeComboBox(options);
        }
        else if (jinput.is(":password"))
        {
            jinput.zoeTextBox(options);
        }
        else if (jinput.is(":text"))
        {
            switch (ltype)
            {
                case "select":
                case "combobox":
                case "autocomplete":
                    jinput.zoeComboBox(options);
                    break;
                case "spinner":
                    jinput.zoeSpinner(options);
                    break;
                case "date":
                    jinput.zoeDateEditor(options);
                    break;
                case "popup":
                    jinput.zoePopupEdit(options);
                    break;
                case "currency":
                    options.currency = true;
                case "float":
                case "number":
                    options.number = true;
                    jinput.zoeTextBox(options);
                    break;
                case "int":
                case "digits":
                    options.digits = true;
                default:
                    jinput.zoeTextBox(options);
                    break;
            }
        }
        else if (jinput.is(":radio"))
        {
            jinput.zoeRadio(options);
        }
        else if (jinput.is(":checkbox"))
        {
            jinput.zoeCheckBox(options);
        }
        else if (jinput.is("textarea"))
        {
            jinput.addClass("l-textarea");
        }
    }

    //表单组件
    $.zoeui.controls.Form = function (element, options)
    {
        $.zoeui.controls.Form.base.constructor.call(this, element, options);
    };

    $.zoeui.controls.Form.zoeExtend($.zoeui.core.UIComponent, {
        __getType: function ()
        {
            return 'Form'
        },
        __idPrev: function ()
        {
            return 'Form';
        },
        _init: function ()
        {
            var g = this, p = this.options;
            $.zoeui.controls.Form.base._init.call(this);
            //编辑构造器初始化
            for (var type in zoe.editors)
            {
                var editor = zoe.editors[type];
                //如果没有默认的或者已经定义
                if (!editor || type in p.editors) continue;
                p.editors[type] = zoe.getEditor($.extend({
                    type: type,
                    master: g
                }, editor));
            }
        },
        _render: function ()
        {
            var g = this, p = this.options;
            var jform = $(this.element);
            g.form = jform.is("form") ? jform : jform.parents("form:first");
            //生成zoeui表单样式
            $("input,select,textarea", jform).each(function ()
            {
                p.editorBulider.call(g, $(this));
            });
            g.set(p);
            g.initValidate();
            if (p.buttons)
            {
                var jbuttons = $('<ul class="l-form-buttons"></ul>').appendTo(jform);
                $(p.buttons).each(function ()
                {
                    var jbutton = $('<li><div></div></li>').appendTo(jbuttons);
                    $("div:first", jbutton).zoeButton(this);
                });
            }

            if (!g.element.id) g.element.id = g.id;
            //分组 收缩/展开
            // $("#" + g.element.id + " .togglebtn").on('click', function ()
            // {
            //     if ($(this).hasClass("togglebtn-down")) $(this).removeClass("togglebtn-down");
            //     else $(this).addClass("togglebtn-down");
            //     var boxs = $(this).parent().nextAll("ul,div");
            //     for (var i = 0; i < boxs.length; i++)
            //     {
            //         var jbox = $(boxs[i]);
            //         if (jbox.hasClass("l-group")) break;
            //         if ($(this).hasClass("togglebtn-down"))
            //         {
            //             jbox.hide();
            //         } else
            //         {
            //             jbox.show();
            //         }

            //     }
            // });
        },
        _setWidth: function (value)
        {
            var g = this, p = this.options;
            if (value) g.form.width(value);
        },
        getEditor: function (name)
        {
            var g = this, p = this.options;
            if (!g.editors) return;
            var o = find(null);
            if (o) return o;
            if (p.tab && p.tab.items)
            {
                for (var i = 0; i < p.tab.items.length; i++)
                {
                    var item = p.tab.items[i];
                    var o = find(item, i);
                    if (o) return o;
                }
            }
            return null;
            function find(tabitem, tabindex)
            {
                var fields = tabitem == null ? p.fields : tabitem.fields;
                for (var i = 0, l = fields.length; i < l; i++)
                {
                    var field = fields[i];
                    var eIndex = tabindex == null ? i : "tab" + tabindex + "_" + i;
                    if (field.name == name && g.editors[eIndex])
                    {
                        return g.editors[eIndex].control;
                    }
                }
            }
        },
        getField: function (index)
        {
            var g = this, p = this.options;
            if (!p.fields) return null;
            return p.fields[index];
        },
        toConditions: function ()
        {
            var g = this, p = this.options;
            var conditions = [];
            $(p.fields).each(function (fieldIndex, field)
            {
                var name = field.name, textField = field.textField, editor = g.editors[fieldIndex];
                if (!editor || !name) return;
                var value = editor.editor.getValue(editor.control, {
                    field: field
                });
                if (value != null && value !== "")
                {
                    conditions.push({
                        op: field.operator || "like",
                        field: name,
                        value: value,
                        type: field.type || "string"
                    });
                }
            });
            return conditions;
        },
        //预处理字段 , 处理分组
        _preSetFields: function (fields)
        {
            var g = this, p = this.options, lastVisitedGroup = null, lastVisitedGroupIcon = null;
            //分组： 先填充没有设置分组的字段
            $(p.fields).each(function (i, field)
            {
                if (p.readonly || field.readonly || (field.editor && field.editor.readonly))
                    delete field.validate;
                if (field.type == "hidden") return;
                field.type = field.type || "text";
                if (field.newline == null) field.newline = true;
                if (lastVisitedGroup && !field.group)
                {
                    field.group = lastVisitedGroup;
                    field.groupicon = lastVisitedGroupIcon;
                }
                if (field.group)
                {
                    field.group = field.group.toString().replace(/^\s\s*/, '').replace(/\s\s*$/, '');
                    lastVisitedGroup = field.group;
                    lastVisitedGroupIcon = field.groupicon;
                }
            });

        },
        _setReadonly: function (readonly)
        {
            var g = this, p = this.options;
            if (readonly && g.editors)
            {
                for (var index in g.editors)
                {
                    var control = g.editors[index].control;
                    if (control && control._setReadonly) control._setReadonly(true);
                }
            }
        },
        _setFields: function (fields)
        {
            var g = this, p = this.options;
            if ($.isFunction(p.prefixID)) p.prefixID = p.prefixID(g);
            var jform = $(g.element).addClass("l-form"); 
            g._initFieldsValidate({
                fields: fields
            });
            g._initFieldsHtml({
                panel: jform,
                fields: fields
            }); 
            g._createEditors({
                fields: fields
            }); 
            g.trigger('afterSetFields');
        },
        _initFieldsValidate: function (e)
        {
            var g = this, p = this.options;
            var fields = e.fields;
            g.validate = g.validate || {};
            if (fields && fields.length)
            {
                $(fields).each(function (index, field)
                {
                    var name = field.name,
                    readonly = (field.readonly || (field.editor && field.editor.readonly)) ? true : false,
                    txtInputName = (p.prefixID || "") + (field.textField || field.id || field.name);
                    if (field.validate && !readonly)
                    {
                        g.validate.rules = g.validate.rules || {};
                        g.validate.rules[txtInputName] = field.validate;
                        if (field.validateMessage)
                        {
                            g.validate.messages = g.validate.messages || {};
                            g.validate.messages[txtInputName] = field.validateMessage;
                        }
                    }
                });
            }
        },
        _initFieldsHtml: function (e)
        {
            var g = this, p = this.options;
            var jform = e.panel,
                fields = e.fields,
                idPrev = e.idPrev || g.id;
            $(">.l-form-container", jform).remove();
            var lineWidth = 0, maxWidth = 0;
            if (fields && fields.length)
            {
                g._preSetFields(fields);
                var out = ['<div class="l-form-container">'],
                    appendULStartTag = false,
                    lastVisitedGroup = null,
                    groups = [];
                $(fields).each(function (index, field)
                {
                    if ($.inArray(field.group, groups) == -1)
                        groups.push(field.group);
                });
                $(groups).each(function (groupIndex, group)
                {
                    $(fields).each(function (i, field)
                    { 
                        if (field.group != group) return;
                        var index = $.inArray(field, fields);
                        var name = field.id || field.name, newline = field.newline;
                        var inputName = (p.prefixID || "") + (field.id || field.name);
                        if (!name) return;
                        if (field.type == "hidden")
                        {    //单个页面 多个form表单不能有同名hidden对象  
                            // if (!$("#" + inputName).length)
                                out.push('<div style="display:none" id="' + (idPrev + "|" + i) + '"></div>');
                            return;
                        }
                        var toAppendGroupRow = field.group && field.group != lastVisitedGroup;
                        if (index == 0 || toAppendGroupRow) newline = true;
                        if (newline)
                        {
                            lineWidth = 0;
                            if (appendULStartTag)
                            {
                                out.push('</ul>');
                                appendULStartTag = false;
                            }
                            if (toAppendGroupRow)
                            {
                                out.push('<div class="l-group');
                                if (field.groupicon)
                                    out.push(' l-group-hasicon');
                                out.push('">');
                                if (field.groupicon)
                                    out.push('<img src="' + field.groupicon + '" />');
                                out.push('<span>' + field.group + '</span></div>');
                                lastVisitedGroup = field.group;
                            }
                            out.push('<ul>');
                            appendULStartTag = true;
                        }
                        out.push('<li class="l-fieldcontainer');
                        if (newline)
                        {
                            out.push(' l-fieldcontainer-first');
                        }
                        out.push('"');
                        out.push(' fieldindex=' + index);
                        out.push('><ul>');
                        if (!field.hideLabel)
                        {
                            out.push(g._buliderLabelContainer(field, index));
                        }
                        //append input 
                        out.push(g._buliderControlContainer(field, index, e.idPrev));
                        //append field 编辑后面自定义内容
                        if (field.afterContent)
                        {
                            var afterContent = $.isFunction(field.afterContent) ? field.afterContent(field) : field.afterContent;
                            afterContent && out.push(afterContent);
                        }
                        //append space
                        if (!field.hideSpace)
                        {
                            out.push(g._buliderSpaceContainer(field, index));
                        }
                        out.push('</ul></li>');

                        lineWidth += (field.width || p.inputWidth || 0);
                        lineWidth += (field.space || p.space || 0);
                        lineWidth += (field.labelWidth || p.labelWidth || 0);
                        if (lineWidth > maxWidth) maxWidth = lineWidth;
                    });
                });
                if (appendULStartTag)
                {
                    out.push('</ul>');
                    appendULStartTag = false;
                }
                out.push('</div>');
                jform.append(out.join(''));
                if (!p.width || maxWidth > p.width)
                {
                    //jform.width(maxWidth + 10);
                }
                $(".l-group .togglebtn", jform).remove();
                $(".l-group", jform).width(jform.width() * 0.95).append("<div class='togglebtn'></div>");
            }
        },
        _createEditors : function(e)
        { 
            var g = this, p = this.options;
            var fields = e.fields,
                idPrev = e.idPrev || g.id,
                editPrev = e.editPrev || "";
            g.editors = g.editors || {}; 
            $(fields).each(function (fieldIndex, field)
            { 
                var container = $("#" + idPrev + "\\|" + fieldIndex, g.element).get(0),
                    editor = p.editors[field.type],
                    editId = editPrev + fieldIndex; 
                if (!container) return; 
                container = $(container);
                var editorControl = g._createEditor(editor, container, {
                    field: field
                }, container.width(), container.height());
                if (!editorControl) return;
                if (g.editors[editId] && g.editors[editId].control && g.editors[editId].control.destroy)
                {
                    g.editors[editId].control.destroy();
                }
                g.editors[editId] = {
                    control: editorControl,
                    editor: editor
                };
            });
        },
        getChanges: function ()
        {
            //本函数返回当前数据与上一次数据之间的差异. 如果没有差异, 则返回空对象. 
            //注意!! getData会导致数据被刷新. 必须严格控制getData的调用. 
            //调用本函数不会导致刷新数据. 
            var g = this, p = this.options;
            var originData = g.data;
            var curData = g.getData();
            g.data = originData;

            var c = {};
            for (var k in originData)
            {
                if (curData[k] != originData[k])
                    c[k] = curData[k];
            }
            return c;
        },
        setEnabled: function (arg, isEnabled)
        {
            var fieldNames = [];
            if ($.isArray(arg)) fieldNames = arg;
            if (typeof (arg) == "string") fieldNames.push(arg);
            var g = this, p = this.options;
            setEnabledInFields(p.fields);
            if (p.tab && p.tab.items)
            {
                for (var i = 0; i < p.tab.items.length; i++)
                {
                    var item = p.tab.items[i];
                    setEnabledInFields(item.fields, i);
                }
            }
            function setEnabledInFields(fields, tabIndex)
            {
                $(fields).each(function (fieldIndex, field)
                {
                    var name = field.name,
                        textField = field.textField,
                        editPrev = tabIndex == null ? "" : "tab" + tabIndex + "_",
                        editor = g.editors[editPrev + fieldIndex];
                    if (!editor || !name) return;
                    if (!editor.editor || !editor.editor.setEnabled) return;
                    if ($.inArray(name, fieldNames) == -1) return;
                    editor.editor.setEnabled(editor.control, isEnabled);
                });
            }
        },
        setVisible: function (arg, isVisible)
        {
            var fieldNames = [];
            if ($.isArray(arg)) fieldNames = arg;
            if (typeof (arg) == "string") fieldNames.push(arg);
            var g = this, p = this.options; 
            setVisibleInFields(p.fields);
            if (p.tab && p.tab.items)
            {
                for (var i = 0; i < p.tab.items.length; i++)
                {
                    var item = p.tab.items[i];
                    setVisibleInFields(item.fields, i);
                }
            }
            function setVisibleInFields(fields, tabIndex)
            {
                $(fields).each(function (fieldIndex, field)
                {
                    var name = field.name;
                    if ($.inArray(name, fieldNames) == -1) return;
                    g._setFieldPanelVisible(tabIndex, fieldIndex, isVisible);
                });
            }
        },
        _setFieldPanelVisible: function (tabindex, fieldindex, visible)
        {
            var g = this, p = this.options;
            if (tabindex == null)
            {
                $("li.l-fieldcontainer[fieldindex=" + fieldindex + "]", g.element)[visible ? 'show' : 'hide']();
            }
            else
            {
                $("div.ui-tabs-panel[data-index=" + tabindex + "] li.l-fieldcontainer[fieldindex=" + fieldindex + "]", g.element)[visible ? 'show' : 'hide']();
            }
        },
        getData: function ()
        {
            var g = this, p = this.options;
            g.data = {};
            getFieldValueToData(p.fields);
            if (p.tab && p.tab.items)
            {
                for (var i = 0; i < p.tab.items.length; i++)
                {
                    var item = p.tab.items[i];
                    getFieldValueToData(item.fields, i);
                }
            }
            function getFieldValueToData(fields, tabIndex)
            {
                $(fields).each(function (fieldIndex, field)
                {
                    var name = field.name,
                        textField = field.textField,
                        editPrev = tabIndex == null ? "" : "tab" + tabIndex + "_",
                        editor = g.editors[editPrev + fieldIndex];
                    if (!editor) return;
                    if (name)
                    {
                        var value = editor.editor.getValue(editor.control, {
                            field: field
                        });
                        g._setValueByName(g.data, name, value);
                    }
                    if (textField)
                    {
                        var value = editor.editor.getText(editor.control, {
                            field: field
                        });
                        g._setValueByName(g.data, textField, value);
                    }
                });
            }
            return g.data;
        },
        _setData: function (data)
        {
            this.setData(data);
        },
        setData: function (data)
        {
            var g = this, p = this.options;
            g.data = data || {};
            setDataToFields(p.fields);
            if (p.tab && p.tab.items)
            {
                for (var i = 0; i < p.tab.items.length; i++)
                {
                    var item = p.tab.items[i];
                    setDataToFields(item.fields, i);
                }
            }
            function setDataToFields(fields, tabIndex)
            {
                $(fields).each(function (fieldIndex, field)
                {
                    var name = field.name,
                        textField = field.textField,
                        editPrev = tabIndex == null ? "" : "tab" + tabIndex + "_",
                        editor = g.editors[editPrev + fieldIndex];
                    if (!editor) return;
                    if (name && (name in g.data))
                    {
                        var value = g._getValueByName(g.data, name);
                        editor.editor.setValue(editor.control, value, {
                            field: field
                        });
                    }
                    if (textField && (textField in g.data))
                    {
                        var text = g._getValueByName(g.data, textField);
                        editor.editor.setText(editor.control, text, {
                            field: field
                        });
                    }
                });
            }
        },
        _setValueByName: function (data, name, value)
        {
            if (!data || !name) return null;
            if (name.indexOf('.') == -1)
            {
                data[name] = value;
            }
            else
            {
                try
                {
                    new Function("data,value", "data." + name + "=value;")(data, value);
                }
                catch (e)
                {
                }
            }
        },
        _getValueByName: function (data, name)
        {
            if (!data || !name) return null;
            if (name.indexOf('.') == -1)
            {
                return data[name];
            }
            else
            {
                try
                {
                    return new Function("data", "return data." + name + ";")(data);
                }
                catch (e)
                {
                    return null;
                }
            }
        },
        /**
         * 隐藏验证提示框
         */
        hideTip: function ()
        {
            var g = this, p = this.options;
            var fields = p.fields;
            for(var i = 0; i < fields.length; i++){
                var name = fields[i].name;
                //如果field为下拉框，则要用comboboxName
                if(fields[i].comboboxName != null){
                    name = fields[i].comboboxName;
                }
                var element = $("[name=" + name + "]", this.element);
                element.zoeHideTip();
            }
        },
        //验证
        valid: function ()
        {
            var g = this, p = this.options;
            if (!g.form || !g.validator) return true;
            return g.form.valid();
        },
        showFieldError: function (name, errorText)
        {
            var element = $("[name=" + name + "]", this.element);
            if (element.hasClass("l-textarea"))
            {
                element.addClass("l-textarea-invalid");
            }
            else if (element.hasClass("l-text-field"))
            {
                element.parent().addClass("l-text-invalid");
            }
            $(element).removeAttr("title").zoeHideTip();
            $(element).attr("title", errorText).zoeTip({
                distanceX: 5,
                distanceY: -3,
                auto: true
            });
        },
        hideFieldError: function (name)
        {
            var element = $("[name=" + name + "]", this.element);
            if (element.hasClass("l-textarea"))
            {
                element.removeClass("l-textarea-invalid");
            }
            else
            {
                element.parent().removeClass("l-text-invalid");
            }
            $(element).removeAttr("title").zoeHideTip();
        },
        //设置验证
        initValidate: function ()
        {
            var g = this, p = this.options;
            if (!g.form || !p.validate || !g.form.validate)
            {
                g.validator = null;
                return;
            }
            var validate = p.validate == true ? {} : p.validate;
            var validateOptions = $.extend({
                errorPlacement: function (lable, element)
                {
                    if (!$(lable).html())
                    {
                        return;
                    }
                    if (!element.attr("id"))
                    {
                        var eleid = new Date().getTime();
                        element.attr("id", eleid);
                        lable.attr("for", eleid);
                    }
                    if (element.hasClass("l-textarea"))
                    {
                        element.addClass("l-textarea-invalid");
                    }
                    else if (element.hasClass("l-text-field"))
                    {
                        element.parent().addClass("l-text-invalid");
                    }
                    $(element).removeAttr("title").zoeHideTip();
                    $(element).attr("title", $(lable).html()).zoeTip({
                        distanceX: 5,
                        distanceY: -3,
                        auto: true
                    });
                },
                success: function (lable)
                {
                    var eleId = lable.attr("for");
                    if (!eleId) return;
                    var element = $("#" + eleId);
                    if (element.hasClass("l-textarea"))
                    {
                        element.removeClass("l-textarea-invalid");
                    }
                    else
                    {
                        element.parent().removeClass("l-text-invalid");
                    }
                    $(element).removeAttr("title").zoeHideTip();
                }
            }, validate, {
                rules: g.validate.rules,
                messages: g.validate.messages
            });
            g.validator = g.form.validate(validateOptions);
        },
        setFieldValidate: function (name, validate, messages)
        {
            var jele = $("[name=" + name + "]");
            if (!jele.length || !jele.rules) return;
            var oldRule = jele.rules("remove");
            if (oldRule) //旧的验证移除验证结果
            {
                if (jele.hasClass("l-text-field"))
                {
                    jele.parent().removeClass("l-text-invalid");
                }
                jele.removeAttr("title").zoeHideTip();
                if (oldRule.required)//旧的验证包括必填规则，移除*
                {
                    jele.parents("li:first").next("li:first").find(".l-star").remove();
                }
            }
            if (!validate)//没有定义新的验证规则
            {
                return;
            }
            var rule = $.extend({}, validate, { messages: messages });
            jele.rules("add", rule);
            if (validate.required)
            {
                //验证包括必填规则，添加*
                jele.parents("li:first").next("li:first").append('<span class="l-star">*</span>');
            }
        },
        //提示 验证错误信息
        showInvalid: function ()
        {
            var g = this, p = this.options;
            if (!g.validator) return;
            var jmessage = $('<div><div class="invalid">' + p.invalidMessage.replace('{errorCount}', g.validator.errorList.length) + '<a class="viewInvalidDetail" href="javascript:void(0)">' + p.detailMessage + '</a></div><div class="invalidDetail" style="display:none;">' + getInvalidInf(g.validator.errorList) + '</div></div>');
            jmessage.find("a.viewInvalidDetail:first").bind('click', function ()
            {
                $(this).parent().next("div.invalidDetail").toggle();
            });
            $.zoeDialog.open({
                type: 'error',
                width: 350,
                showMax: false,
                showToggle: false,
                showMin: false,
                target: jmessage,
                buttons: [
                    {
                        text: p.okMessage, onclick: function (item, dailog)
                        {
                            dailog.close();
                        }
                    }
                ]
            });
        },
        _createEditor: function (editorBuilder, container, editParm, width, height)
        {
            var g = this, p = this.options;
            try
            {
                var editor = editorBuilder.create.call(this, container, editParm, p);
                if (editor && editorBuilder.resize)
                    editorBuilder.resize.call(this, editor, width, height, editParm);
                return editor;
            } catch (e)
            {
                return null;
            }
        },
        //标签部分
        _buliderLabelContainer: function (field)
        {
            var g = this, p = this.options;
            var label = field.label || field.display;
            var labelWidth = field.labelWidth || field.labelwidth || p.labelWidth;
            var labelAlign = field.labelAlign || p.labelAlign;
            if (label) label += field.rightToken || p.rightToken;
            var out = [];
            out.push('<li');
            if (p.labelCss)
            {
                out.push(' class="' + p.labelCss + '"');
            }
            out.push(' style="');
            if (/px$/i.test(labelWidth) || /auto/i.test(labelWidth) || /%$/i.test(labelWidth))
            {
                out.push('width:' + labelWidth + ';');
            }
            else if (labelWidth)
            {
                out.push('width:' + labelWidth + 'px;');
            }
            if (labelAlign)
            {
                out.push('text-align:' + labelAlign + ';');
            }

            out.push('">');
            if (label)
            {
                out.push(label);
            }
            out.push('</li>');
            return out.join('');
        },
        //控件部分
        _buliderControlContainer: function (field, fieldIndex, idPrev)
        {
            var g = this, p = this.options;
            var width = field.width || p.inputWidth,
                align = field.align || field.textAlign || field.textalign || p.align,
                out = [],
                idPrev = idPrev || g.id;
            out.push('<li');
            out.push(' id="' + (idPrev + "|" + fieldIndex) + '"');
            if (p.fieldCss)
            {
                out.push(' class="' + p.fieldCss + '"');
            }
            out.push(' style="');
            if (width)
            {
                out.push('width:' + width + 'px;');
            }
            if (align)
            {
                out.push('text-align:' + align + ';');
            }
            out.push('">');
            out.push('</li>');
            return out.join('');
        },
        //间隔部分
        _buliderSpaceContainer: function (field)
        {
            var g = this, p = this.options;
            var spaceWidth = field.space || field.spaceWidth || p.space;
            if (field.space === 0 || field.spaceWidth === 0) spaceWidth = 0;
            var out = [];
            out.push('<li');
            if (p.spaceCss)
            {
                out.push(' class="' + p.spaceCss + '"');
            }
            out.push(' style="');
            if (/px$/i.test(spaceWidth) || /auto/i.test(spaceWidth) || /%$/i.test(spaceWidth))
            {
                out.push('width:' + spaceWidth + ';');
            }
            if (spaceWidth)
            {
                out.push('width:' + spaceWidth + 'px;');
            }
            out.push('">');
            if (field.validate && field.validate.required)
            {
                out.push("<span class='l-star'>*</span>");
            }
            out.push('</li>');
            return out.join('');
        },
        _getInputAttrHtml: function (field)
        {
            var out = [], type = (field.type || "text").toLowerCase();
            if (type == "textarea")
            {
                field.cols && out.push('cols="' + field.cols + '" ');
                field.rows && out.push('rows="' + field.rows + '" ');
            }
            out.push('ltype="' + type + '" ');
            field.op && out.push('op="' + field.op + '" ');
            field.vt && out.push('vt="' + field.vt + '" ');
            if (field.attr)
            {
                for (var attrp in field.attr)
                {
                    out.push(attrp + '="' + field.attr[attrp] + '" ');
                }
            }
            return out.join('');
        },
        _setTab: function (tab)
        {
            var g = this, p = this.options;
            if (!tab || !tab.items) return;
            var jtab = $('<div class="l-form-tabs"></div>').appendTo(g.element);
            var jtabNav = $('<ul class="ui-tabs-nav ui-helper-reset ui-helper-clearfix ui-widget-header ui-corner-all" original-title="">').appendTo(jtab);
            for (var i = 0; i < tab.items.length; i++)
            {
                var tabItem = tab.items[i],
                    jnavItem = $('<li class="ui-state-default ui-corner-top"><a href="javascript:void(0)"></a></li>').appendTo(jtabNav),
                    jcontentItem = $('<div class="ui-tabs-panel ui-widget-content ui-corner-bottom">').appendTo(jtab),
                    idPrev = g.id + "|tdb" + i;
                jnavItem.add(jcontentItem).attr("data-index", i);
                jnavItem.find("a:first").text(tabItem.title);
                g._initFieldsValidate({
                    fields: tabItem.fields
                });
                g._initFieldsHtml({
                    panel: jcontentItem,
                    fields: tabItem.fields,
                    idPrev: idPrev
                }); 
                g._createEditors({
                    fields: tabItem.fields,
                    idPrev: idPrev,
                    editPrev: 'tab' + i + "_"
                }); 
            }
            jtabNav.find("li").hover(function ()
            {
                $(this).addClass("ui-state-active");
            }, function ()
            {
                $(this).removeClass("ui-state-active");
            }).click(function ()
            {
                var index = $(this).attr("data-index");
                g.selectTab(index);
            });
            g.selectTab(0);
        },
        selectTab: function (index)
        {
            var g = this, p = this.options;
            var jtab = $(g.element).find(".l-form-tabs:first");
            var links = jtab.find(".ui-tabs-nav li"), contents = jtab.find(".ui-tabs-panel");
            links.filter("[data-index=" + index + "]")
                .addClass("ui-tabs-selected ui-state-active ui-state-hover");
            links.filter("[data-index!=" + index + "]")
                .removeClass("ui-tabs-selected ui-state-active ui-state-hover");
            contents.filter("[data-index=" + index + "]").show();
            contents.filter("[data-index!=" + index + "]").hide();
        }
    });


    function getInvalidInf(errorList)
    {
        var out = [];
        $(errorList).each(function (i, error)
        {
            var label = $(error.element).parents("li:first").prev("li:first").html();
            var message = error.message;
            out.push('<div>' + label + ' ' + message + '</div>');
        });
        return out.join('');
    }
})(jQuery);

/**
* jQuery zoeUI 1.0
* popupEdit
* 
*/
(function ($)
{
    $.fn.zoePopupEdit = function (options)
    {
        return $.zoeui.run.call(this, "zoePopupEdit", arguments);
    };
    $.fn.zoeGetPopupEditManager = function ()
    {
        return $.zoeui.run.call(this, "zoeGetPopupEditManager", arguments);
    };
    $.zoeDefaults.PopupEdit = {
        valueFieldID: null,     //生成的value input:hidden 字段名
        css: null,             //附加css
        onButtonClick: null,    //利用这个参数来调用其他函数，比如打开一个新窗口来选择值 
        nullText: null,         //不能为空时的提示
        disabled: false,        //是否无效
        cancelable: true,
        width: 200,
        heigth: null,
        render: null,        //显示函数   
        split: ';',
        grid: null,       //在 可查询、可分页列表的弹出框 中选择值 
        condition: null,  // 条件字段,比如 {fields:[{ name : 'Title' ,op : 'like', vt : 'string',type:'text' }]}
        valueField: 'id', //值字段
        textField: 'text',   //显示字段
        parms: null,
        onSelect: null,    //选择事件,可阻止
        onSelected: null,  //选择后事件
        valueFieldCssClass: null
    };
    //扩展方法
    $.zoeMethos.PopupEdit = $.zoeMethos.PopupEdit || {};
    $.zoeui.controls.PopupEdit = function (element, options)
    {
        $.zoeui.controls.PopupEdit.base.constructor.call(this, element, options);
    };
    $.zoeui.controls.PopupEdit.zoeExtend($.zoeui.controls.Input, {
        __getType: function ()
        {
            return 'PopupEdit';
        },
        _extendMethods: function ()
        {
            return $.zoeMethos.PopupEdit;
        },
        _init: function ()
        {
            $.zoeui.controls.PopupEdit.base._init.call(this);
        },
        _render: function ()
        {
            var g = this, p = this.options;
            g.inputText = null;
            //文本框初始化
            if (this.element.tagName.toLowerCase() == "input")
            {
                this.element.readOnly = true;
                g.inputText = $(this.element);
                g.textFieldID = this.element.id;
            }
            if (g.inputText[0].name == undefined) g.inputText[0].name = g.textFieldID;
            //隐藏域初始化
            g.valueField = null;
            if (p.valueFieldID)
            {
                g.valueField = $("#" + p.valueFieldID + ":input");
                if (g.valueField.length == 0) g.valueField = $('<input type="hidden"/>');
                g.valueField[0].id = g.valueField[0].name = p.valueFieldID;
            }
            else
            {
                g.valueField = $('<input type="hidden"/>');
                g.valueField[0].id = g.valueField[0].name = g.textFieldID + "_val";
            }
            if (g.valueField[0].name == undefined) g.valueField[0].name = g.valueField[0].id;
            if (p.valueFieldCssClass)
            {
                g.valueField.addClass(p.valueFieldCssClass);
            }
            //开关
            g.link = $('<div class="l-trigger"><div class="l-trigger-icon"></div></div>');
            //外层
            g.wrapper = g.inputText.wrap('<div class="l-text l-text-popup"></div>').parent();
            g.wrapper.append('<div class="l-text-l"></div><div class="l-text-r"></div>');
            g.wrapper.append(g.link);
            g.wrapper.append(g.valueField);
            //修复popup控件没有data-zoeid的问题
            g.valueField.attr("data-zoeid", g.id);
            g.inputText.addClass("l-text-field");
            //开关 事件
            g.link.hover(function ()
            {
                if (p.disabled) return;
                this.className = "l-trigger-hover";
            }, function ()
            {
                if (p.disabled) return;
                this.className = "l-trigger";
            }).mousedown(function ()
            {
                if (p.disabled) return;
                this.className = "l-trigger-pressed";
            }).mouseup(function ()
            {
                if (p.disabled) return;
                this.className = "l-trigger-hover";
            }).click(function ()
            {
                if (p.disabled) return;
                if (g.trigger('buttonClick') == false) return false;
            });
            g.inputText.click(function ()
            {
                if (p.disabled) return;
            }).blur(function ()
            {
                if (p.disabled) return;
                g.wrapper.removeClass("l-text-focus");
            }).focus(function ()
            {
                if (p.disabled) return;
                g.wrapper.addClass("l-text-focus");
            });
            g.wrapper.hover(function ()
            {
                if (p.disabled) return;
                g.wrapper.addClass("l-text-over");
            }, function ()
            {
                if (p.disabled) return;
                g.wrapper.removeClass("l-text-over");
            });
            g.set(p);
        },
        destroy: function ()
        {
            if (this.wrapper) this.wrapper.remove();
            this.options = null;
            $.zoeui.remove(this);
        },
        clear: function ()
        {
            var g = this, p = this.options;
            g.inputText.val("");
            g.valueField.val("");
        },
        _setCss: function (css)
        {
            if (css)
            {
                this.wrapper.addClass(css);
            }
        },
        //取消选择 
        _setCancelable: function (value)
        {
            var g = this, p = this.options;
            if (!value && g.unselect)
            {
                g.unselect.remove();
                g.unselect = null;
            }
            if (!value && !g.unselect) return;
            g.unselect = $('<div class="l-trigger l-trigger-cancel"><div class="l-trigger-icon"></div></div>').hide();
            g.wrapper.hover(function ()
            {
                g.unselect.show();
            }, function ()
            {
                g.unselect.hide();
            })
            if (!p.disabled && p.cancelable)
            {
                g.wrapper.append(g.unselect);
            }
            g.unselect.hover(function ()
            {
                this.className = "l-trigger-hover l-trigger-cancel";
            }, function ()
            {
                this.className = "l-trigger l-trigger-cancel";
            }).click(function ()
            {
                g.clear();
            });
        },
        _setDisabled: function (value)
        {
            if (value)
            {
                this.wrapper.addClass('l-text-disabled');
            } else
            {
                this.wrapper.removeClass('l-text-disabled');
            }
        },
        _setWidth: function (value)
        {
            var g = this;
            if (value > 20)
            {
                g.wrapper.css({ width: value });
                g.inputText.css({ width: value - 20 });
            }
        },
        _setHeight: function (value)
        {
            var g = this;
            if (value > 10)
            {
                g.wrapper.height(value);
                g.inputText.height(value - 2);
            }
        },
        getData: function ()
        {
            var g = this, p = this.options;
            var data = [];
            var v = $(g.valueField).val(), t = $(g.inputText).val();
            var values = v ? v.split(p.split) : null, texts = t ? t.split(p.split) : null;
            $(values).each(function (i)
            {
                var o = {};
                o[p.textField] = texts[i];
                o[p.valueField] = values[i];
                data.push(o);
            });
            return data;
        },
        _getText: function ()
        {
            return $(this.inputText).val();
        },
        _getValue: function ()
        {
            return $(this.valueField).val();
        },
        getValue: function ()
        {
            return this._getValue();
        },
        getText: function ()
        {
            return this._getText();
        },
        //设置值到  隐藏域
        setValue: function (value, text)
        {
            var g = this, p = this.options;
            if (arguments.length >= 2)
            {
                g.setValue(value);
                g.setText(text);
                return;
            }
            g.valueField.val(value);
        },
        //设置值到 文本框 
        setText: function (text)
        {
            var g = this, p = this.options;
            if (p.render)
            {
                g.inputText.val(p.render(text));
            }
            else
            {
                g.inputText.val(text);
            }
        },
        addValue: function (value, text)
        {
            var g = this, p = this.options;
            if (!value) return;
            var v = g.getValue(), t = g.getText();
            if (!v)
            {
                g.setValue(value);
                g.setText(text);
            } else
            {
                var arrV = [], arrT = [], old = v.split(p.split), value = value.split(p.split), text = text.split(p.split);
                for (var i = 0, l = value.length; i < l; i++)
                {
                    if ($.inArray(value[i], old) == -1)
                    {
                        arrV.push(value[i]);
                        arrT.push(text[i]);
                    }
                }
                if (arrV.length)
                {
                    g.setValue(v + p.split + arrV.join(p.split));
                    g.setText(t + p.split + arrT.join(p.split));
                }
            }
        },
        removeValue: function (value, text)
        {
            var g = this, p = this.options;
            if (!value) return;
            var v = g.getValue(), t = g.getText();
            if (!v) return;
            var oldV = v.split(p.split), oldT = t.split(p.split), value = value.split(p.split);
            for (var i = 0, index = -1, l = value.length; i < l; i++)
            {
                if ((index = $.inArray(value[i], oldV)) != -1)
                {
                    oldV.splice(index, 1);
                    oldT.splice(index, 1);
                }
            }
            g.setValue(oldV.join(p.split));
            g.setText(oldT.join(p.split));
        },
        _setGrid: function (value)
        {
            if (!value) return;
            var g = this, p = this.options;
            var gridOptions = $.extend({
                parms: p.parms
            }, p.grid);
            this.bind('buttonClick', function ()
            {
                function getLastSelected()
                {
                    try{
                        return g.getData();
                    } catch (e)
                    {
                        return null;
                    }
                }
                if (!g.popupFn)
                {
                    var options = {
                        grid: gridOptions,
                        condition: p.condition,
                        valueField: p.valueField,
                        textField: p.textField,
                        split: p.split,
                        lastSelected: getLastSelected(),
                        onSelect: function (e)
                        {
                            if (g.trigger('select', e) == false) return;
                            if (p.grid.checkbox)
                            {
                                g.addValue(e.value, e.text);
                                g.removeValue(e.remvoeValue, e.remvoeText);
                            } else
                            {
                                g.setValue(e.value);
                                g.setText(e.text);
                            }
                            g.trigger('selected', e);
                        },
                        selectInit: function (rowdata)
                        {
                            var value = g.getValue();
                            if (!value) return false;
                            if (!p.valueField || !rowdata[p.valueField]) return false;
                            return $.inArray(rowdata[p.valueField].toString(), value.split(p.split)) != -1;
                        }
                    };
                    g.popupFn = $.zoeui.getPopupFn(options);
                }
                g.popupFn();
            });
        }
    });
    //创建一个可查询、可分页列表的选取弹出框 需要dialog,grid,form等插件的支持
    $.zoeui.getPopupFn = function (p)
    {
        p = $.extend({
            title: '选择数据',     //窗口标题
            width: 700,            //窗口宽度     
            height: 320,           //列表高度
            top: null,
            left: null,
            split: ';',
            valueField: null,    //接收表格的value字段名
            textField: null,     //接收表格的text字段名
            grid: null,          //表格的参数 同zoeGrid
            condition: null,     //搜索表单的参数 同zoeForm
            onSelect: function (p) { },   //选取函数 
            selectInit: function (rowdata) { return false }  //选择初始化
        }, p);
        if (!p.grid) return;
        var win, grid, condition, lastSelected = p.lastSelected || [];
        return function ()
        {
            show();
            return false;
        };
        function show()
        {
            function getGridHeight(height)
            {
                height = height || p.height;
                height -= conditionPanel.height();
                return height;
            }
            if (win)
            {
                grid._showData();
                win.show();
                grid.refreshSize();
                lastSelected = grid.selected.concat();
                return;
            }
            var panle = $("<div></div>");
            var conditionPanel = $("<div></div>");
            var gridPanel = $("<div></div>");
            panle.append(conditionPanel).append(gridPanel);
            if (p.condition)
            { 
                var conditionParm = $.extend({
                    labelWidth: 60,
                    space: 20
                }, p.condition);
                condition = conditionPanel.zoeForm(conditionParm);
            } else
            {
                conditionPanel.remove();
            }
            var gridParm = $.extend({
                columnWidth: 120,
                alternatingRow: false,
                frozen: true,
                rownumbers: true
            }, p.grid, {
                width: "100%",
                height: getGridHeight(),
                isChecked: p.selectInit,
                isSelected: p.selectInit,
                inWindow: false
            });
            //grid
            grid = gridPanel.zoeGrid(gridParm);
            //搜索按钮
            if (p.condition)
            {
                var containerBtn1 = $('<li style="margin-right:9px"><div></div></li>');
                $("ul:first", conditionPanel).append(containerBtn1).after('<div class="l-clear"></div>');
                $("div", containerBtn1).zoeButton({
                    text: '搜索',
                    click: function ()
                    {
                        var rules = $.zoeui.getConditions(conditionPanel);
                        grid.setParm('condition', $.zoeui.toJSON(rules));
                        grid.reload();
                    }
                });
            }
            //dialog
            win = $.zoeDialog.open({
                title: p.title,
                width: p.width,
                height: 'auto',
                top: p.top,
                left: p.left,
                popupType:true,
                target: panle,
                isResize: true,
                cls: 'l-selectorwin',
                onContentHeightChange: function (height)
                {
                    grid.set('height', getGridHeight(height));
                    return false;
                },
                onStopResize: function ()
                {
                    grid.refreshSize();
                },
                buttons: [
                 { text: '选择', onclick: function (item, dialog) { toSelect(); dialog.hide(); } },
                 { text: '取消', onclick: function (item, dialog) { dialog.hide(); } }
                ]
            });
            grid.refreshSize();
            //修复编辑弹窗位置
            try{
                var top = 0.5 * ($(window).height() - $(win.element).height()) + $(window).scrollTop() - 10;
                $(win.element).css("top",top);
            }catch(error){
                return;
            }
        }
        function exist(value, data)
        {
            for (var i = 0; data && data[i]; i++)
            {
                var item = data[i];
                if (item[p.valueField] == value) return true;
            }
            return false;
        }
        function toSelect()
        {
            var selected = grid.selected || [];
            var value = [], text = [], data = [];
            $(selected).each(function (i, rowdata)
            {
                p.valueField && value.push(rowdata[p.valueField]);
                p.textField && text.push(rowdata[p.textField]);
                var o = $.extend(true, {}, this);
                grid.formatRecord(o, true);
                data.push(o);
            });
            var unSelected = [];
            $(lastSelected).each(function (i, item)
            {
                if (!exist(item[p.valueField], selected) && exist(item[p.valueField], grid.rows))
                {
                    unSelected.push(item);
                }
            });
            var removeValue = [], removeText = [], removeData = [];
            $(unSelected).each(function (i, rowdata)
            {
                p.valueField && removeValue.push(rowdata[p.valueField]);
                p.textField && removeText.push(rowdata[p.textField]);
                var o = $.extend(true, {}, this);
                grid.formatRecord(o, true);
                removeData.push(o);
            });
            p.onSelect({
                value: value.join(p.split),
                text: text.join(p.split),
                data: data,
                remvoeValue: removeValue.join(p.split),
                remvoeText: removeText.join(p.split),
                removeData: removeData
            });
        }
    };
})(jQuery);

﻿/**
* jQuery zoeUI 1.0
* 
*toolbar 
* 
*/
(function ($)
{

    $.fn.zoeToolBar = function (options)
    {
        return $.zoeui.run.call(this, "zoeToolBar", arguments);
    };

    $.fn.zoeGetToolBarManager = function ()
    {
        return $.zoeui.run.call(this, "zoeGetToolBarManager", arguments);
    };

    $.zoeDefaults.ToolBar = {};

    $.zoeMethos.ToolBar = {};

    $.zoeui.controls.ToolBar = function (element, options)
    {
        $.zoeui.controls.ToolBar.base.constructor.call(this, element, options);
    };
    $.zoeui.controls.ToolBar.zoeExtend($.zoeui.core.UIComponent, {
        __getType: function ()
        {
            return 'ToolBar';
        },
        __idPrev: function ()
        {
            return 'ToolBar';
        },
        _extendMethods: function ()
        {
            return $.zoeMethos.ToolBar;
        },
        _render: function ()
        {
            var g = this, p = this.options;
            g.toolbarItemCount = 0;
            g.toolBar = $(this.element);
            g.toolBar.addClass("l-toolbar");
            g.set(p);
        },
        _setItems: function (items)
        {
            var g = this;
            g.toolBar.html("");
            $(items).each(function (i, item)
            {
                g.addItem(item);
            });
        },
        removeItem: function (itemid)
        {
            var g = this, p = this.options;
            $("> .l-toolbar-item[toolbarid=" + itemid + "]", g.toolBar).remove();
        },
        setEnabled: function (itemid)
        {
            var g = this, p = this.options;
            $("> .l-toolbar-item[toolbarid=" + itemid + "]", g.toolBar).removeClass("l-toolbar-item-disable");
        },
        setDisabled: function (itemid)
        {
            var g = this, p = this.options;
            $("> .l-toolbar-item[toolbarid=" + itemid + "]", g.toolBar).addClass("l-toolbar-item-disable");
        },
        isEnable: function (itemid)
        {
            var g = this, p = this.options;
            return !$("> .l-toolbar-item[toolbarid=" + itemid + "]", g.toolBar).hasClass("l-toolbar-item-disable");
        },
        addItem: function (item)
        {
            var g = this, p = this.options;
            if (item.line || item.type == "line")
            {
                g.toolBar.append('<div class="l-bar-separator"></div>');
                return;
            }
            if (item.type == "text")
            {
                g.toolBar.append('<div class="l-toolbar-item l-toolbar-text"><span>' + item.text || "" + '</span></div>');
                return;
            }
            var ditem = $('<div class="l-toolbar-item l-panel-btn"><span></span><div class="l-panel-btn-l"></div><div class="l-panel-btn-r"></div></div>');
            g.toolBar.append(ditem);
            if(!item.id) item.id = 'item-'+(++g.toolbarItemCount);
            ditem.attr("toolbarid", item.id);
            if (item.img)
            {
                ditem.append("<img src='" + item.img + "' />");
                ditem.addClass("l-toolbar-item-hasicon");
            }
            else if (item.icon)
            {
                ditem.append("<div class='l-icon l-icon-" + item.icon + "'></div>");
                ditem.addClass("l-toolbar-item-hasicon");
            }
            else if (item.color)
            {
                ditem.append("<div class='l-toolbar-item-color' style='background:"+item.color+"'></div>");
                ditem.addClass("l-toolbar-item-hasicon");
            }
            item.text && $("span:first", ditem).html(item.text);
            item.disable && ditem.addClass("l-toolbar-item-disable");
            item.click && ditem.click(function () { if ($(this).hasClass("l-toolbar-item-disable")) return;item.click(item); });
            if (item.menu)
            {
                item.menu = $.zoeMenu(item.menu);
                ditem.hover(function ()
                {
                    if ($(this).hasClass("l-toolbar-item-disable")) return;
                    g.actionMenu && g.actionMenu.hide();
                    var left = $(this).offset().left;
                    var top = $(this).offset().top + $(this).height();
                    item.menu.show({ top: top, left: left });
                    g.actionMenu = item.menu;
                    $(this).addClass("l-panel-btn-over");
                }, function ()
                {
                    if ($(this).hasClass("l-toolbar-item-disable")) return;
                    $(this).removeClass("l-panel-btn-over");
                });
            }
            else
            {
                ditem.hover(function ()
                {
                    if ($(this).hasClass("l-toolbar-item-disable")) return;
                    $(this).addClass("l-panel-btn-over");
                }, function ()
                {
                    if ($(this).hasClass("l-toolbar-item-disable")) return;
                    $(this).removeClass("l-panel-btn-over");
                });
            }
        }
    });
    //旧写法保留
    $.zoeui.controls.ToolBar.prototype.setEnable = $.zoeui.controls.ToolBar.prototype.setEnabled;
    $.zoeui.controls.ToolBar.prototype.setDisable = $.zoeui.controls.ToolBar.prototype.setDisabled;
})(jQuery);

/* jquery.nicescroll 3.6.6 InuYaksa*2015 MIT http://nicescroll.areaaperta.com */(function(e){"function"===typeof define&&define.amd?define(["jquery"],e):"object"===typeof exports?module.exports=e(require("jquery")):e(jQuery)})(function(e){var A=!1,E=!1,O=0,P=2E3,z=0,I=["webkit","ms","moz","o"],u=window.requestAnimationFrame||!1,v=window.cancelAnimationFrame||!1;if(!u)for(var Q in I){var F=I[Q];u||(u=window[F+"RequestAnimationFrame"]);v||(v=window[F+"CancelAnimationFrame"]||window[F+"CancelRequestAnimationFrame"])}var x=window.MutationObserver||window.WebKitMutationObserver||
!1,J={zindex:"auto",cursoropacitymin:0,cursoropacitymax:1,cursorcolor:"#424242",cursorwidth:"5px",cursorborder:"1px solid #fff",cursorborderradius:"5px",scrollspeed:60,mousescrollstep:24,touchbehavior:!1,hwacceleration:!0,usetransition:!0,boxzoom:!1,dblclickzoom:!0,gesturezoom:!0,grabcursorenabled:!0,autohidemode:!0,background:"",iframeautoresize:!0,cursorminheight:32,preservenativescrolling:!0,railoffset:!1,railhoffset:!1,bouncescroll:!0,spacebarenabled:!0,railpadding:{top:0,right:0,left:0,bottom:0},
disableoutline:!0,horizrailenabled:!0,railalign:"right",railvalign:"bottom",enabletranslate3d:!0,enablemousewheel:!0,enablekeyboard:!0,smoothscroll:!0,sensitiverail:!0,enablemouselockapi:!0,cursorfixedheight:!1,directionlockdeadzone:6,hidecursordelay:400,nativeparentscrolling:!0,enablescrollonselection:!0,overflowx:!0,overflowy:!0,cursordragspeed:.3,rtlmode:"auto",cursordragontouch:!1,oneaxismousemode:"auto",scriptpath:function(){var e=document.getElementsByTagName("script"),e=e.length?e[e.length-
1].src.split("?")[0]:"";return 0<e.split("/").length?e.split("/").slice(0,-1).join("/")+"/":""}(),preventmultitouchscrolling:!0},G=!1,R=function(){if(G)return G;var e=document.createElement("DIV"),c=e.style,h=navigator.userAgent,n=navigator.platform,d={haspointerlock:"pointerLockElement"in document||"webkitPointerLockElement"in document||"mozPointerLockElement"in document};d.isopera="opera"in window;d.isopera12=d.isopera&&"getUserMedia"in navigator;d.isoperamini="[object OperaMini]"===Object.prototype.toString.call(window.operamini);
d.isie="all"in document&&"attachEvent"in e&&!d.isopera;d.isieold=d.isie&&!("msInterpolationMode"in c);d.isie7=d.isie&&!d.isieold&&(!("documentMode"in document)||7==document.documentMode);d.isie8=d.isie&&"documentMode"in document&&8==document.documentMode;d.isie9=d.isie&&"performance"in window&&9<=document.documentMode;d.isie10=d.isie&&"performance"in window&&10==document.documentMode;d.isie11="msRequestFullscreen"in e&&11<=document.documentMode;d.isieedge=navigator.userAgent.match(/Edge\/12\./);d.isie9mobile=
/iemobile.9/i.test(h);d.isie9mobile&&(d.isie9=!1);d.isie7mobile=!d.isie9mobile&&d.isie7&&/iemobile/i.test(h);d.ismozilla="MozAppearance"in c;d.iswebkit="WebkitAppearance"in c;d.ischrome="chrome"in window;d.ischrome22=d.ischrome&&d.haspointerlock;d.ischrome26=d.ischrome&&"transition"in c;d.cantouch="ontouchstart"in document.documentElement||"ontouchstart"in window;d.hasmstouch=window.MSPointerEvent||!1;d.hasw3ctouch=(window.PointerEvent||!1)&&(0<navigator.MaxTouchPoints||0<navigator.msMaxTouchPoints);
d.ismac=/^mac$/i.test(n);d.isios=d.cantouch&&/iphone|ipad|ipod/i.test(n);d.isios4=d.isios&&!("seal"in Object);d.isios7=d.isios&&"webkitHidden"in document;d.isandroid=/android/i.test(h);d.haseventlistener="addEventListener"in e;d.trstyle=!1;d.hastransform=!1;d.hastranslate3d=!1;d.transitionstyle=!1;d.hastransition=!1;d.transitionend=!1;n=["transform","msTransform","webkitTransform","MozTransform","OTransform"];for(h=0;h<n.length;h++)if("undefined"!=typeof c[n[h]]){d.trstyle=n[h];break}d.hastransform=
!!d.trstyle;d.hastransform&&(c[d.trstyle]="translate3d(1px,2px,3px)",d.hastranslate3d=/translate3d/.test(c[d.trstyle]));d.transitionstyle=!1;d.prefixstyle="";d.transitionend=!1;for(var n="transition webkitTransition msTransition MozTransition OTransition OTransition KhtmlTransition".split(" "),p=" -webkit- -ms- -moz- -o- -o -khtml-".split(" "),q="transitionend webkitTransitionEnd msTransitionEnd transitionend otransitionend oTransitionEnd KhtmlTransitionEnd".split(" "),h=0;h<n.length;h++)if(n[h]in
c){d.transitionstyle=n[h];d.prefixstyle=p[h];d.transitionend=q[h];break}d.ischrome26&&(d.prefixstyle=p[1]);d.hastransition=d.transitionstyle;a:{h=["-webkit-grab","-moz-grab","grab"];if(d.ischrome&&!d.ischrome22||d.isie)h=[];for(n=0;n<h.length;n++)if(p=h[n],c.cursor=p,c.cursor==p){c=p;break a}c="url(//mail.google.com/mail/images/2/openhand.cur),n-resize"}d.cursorgrabvalue=c;d.hasmousecapture="setCapture"in e;d.hasMutationObserver=!1!==x;return G=d},S=function(k,c){function h(){var b=a.doc.css(f.trstyle);
return b&&"matrix"==b.substr(0,6)?b.replace(/^.*\((.*)\)$/g,"$1").replace(/px/g,"").split(/, +/):!1}function n(){var b=a.win;if("zIndex"in b)return b.zIndex();for(;0<b.length&&9!=b[0].nodeType;){var g=b.css("zIndex");if(!isNaN(g)&&0!=g)return parseInt(g);b=b.parent()}return!1}function d(b,g,l){g=b.css(g);b=parseFloat(g);return isNaN(b)?(b=y[g]||0,l=3==b?l?a.win.outerHeight()-a.win.innerHeight():a.win.outerWidth()-a.win.innerWidth():1,a.isie8&&b&&(b+=1),l?b:0):b}function p(b,g,l,c){a._bind(b,g,function(a){a=
a?a:window.event;var c={original:a,target:a.target||a.srcElement,type:"wheel",deltaMode:"MozMousePixelScroll"==a.type?0:1,deltaX:0,deltaZ:0,preventDefault:function(){a.preventDefault?a.preventDefault():a.returnValue=!1;return!1},stopImmediatePropagation:function(){a.stopImmediatePropagation?a.stopImmediatePropagation():a.cancelBubble=!0}};"mousewheel"==g?(c.deltaY=-.025*a.wheelDelta,a.wheelDeltaX&&(c.deltaX=-.025*a.wheelDeltaX)):c.deltaY=a.detail;return l.call(b,c)},c)}function q(b,g,c){var d,f;0==
b.deltaMode?(d=-Math.floor(a.opt.mousescrollstep/54*b.deltaX),f=-Math.floor(a.opt.mousescrollstep/54*b.deltaY)):1==b.deltaMode&&(d=-Math.floor(b.deltaX*a.opt.mousescrollstep),f=-Math.floor(b.deltaY*a.opt.mousescrollstep));g&&a.opt.oneaxismousemode&&0==d&&f&&(d=f,f=0,c&&(0>d?a.getScrollLeft()>=a.page.maxw:0>=a.getScrollLeft())&&(f=d,d=0));d&&(a.scrollmom&&a.scrollmom.stop(),a.lastdeltax+=d,a.debounced("mousewheelx",function(){var b=a.lastdeltax;a.lastdeltax=0;a.rail.drag||a.doScrollLeftBy(b)},15));
if(f){if(a.opt.nativeparentscrolling&&c&&!a.ispage&&!a.zoomactive)if(0>f){if(a.getScrollTop()>=a.page.maxh)return!0}else if(0>=a.getScrollTop())return!0;a.scrollmom&&a.scrollmom.stop();a.lastdeltay+=f;a.debounced("mousewheely",function(){var b=a.lastdeltay;a.lastdeltay=0;a.rail.drag||a.doScrollBy(b)},15)}b.stopImmediatePropagation();return b.preventDefault()}var a=this;this.version="3.6.6";this.name="nicescroll";this.me=c;this.opt={doc:e("body"),win:!1};e.extend(this.opt,J);this.opt.snapbackspeed=
80;if(k)for(var H in a.opt)"undefined"!=typeof k[H]&&(a.opt[H]=k[H]);this.iddoc=(this.doc=a.opt.doc)&&this.doc[0]?this.doc[0].id||"":"";this.ispage=/^BODY|HTML/.test(a.opt.win?a.opt.win[0].nodeName:this.doc[0].nodeName);this.haswrapper=!1!==a.opt.win;this.win=a.opt.win||(this.ispage?e(window):this.doc);this.docscroll=this.ispage&&!this.haswrapper?e(window):this.win;this.body=e("body");this.iframe=this.isfixed=this.viewport=!1;this.isiframe="IFRAME"==this.doc[0].nodeName&&"IFRAME"==this.win[0].nodeName;
this.istextarea="TEXTAREA"==this.win[0].nodeName;this.forcescreen=!1;this.canshowonmouseevent="scroll"!=a.opt.autohidemode;this.page=this.view=this.onzoomout=this.onzoomin=this.onscrollcancel=this.onscrollend=this.onscrollstart=this.onclick=this.ongesturezoom=this.onkeypress=this.onmousewheel=this.onmousemove=this.onmouseup=this.onmousedown=!1;this.scroll={x:0,y:0};this.scrollratio={x:0,y:0};this.cursorheight=20;this.scrollvaluemax=0;this.isrtlmode="auto"==this.opt.rtlmode?"rtl"==(this.win[0]==window?
this.body:this.win).css("direction"):!0===this.opt.rtlmode;this.observerbody=this.observerremover=this.observer=this.scrollmom=this.scrollrunning=!1;do this.id="ascrail"+P++;while(document.getElementById(this.id));this.hasmousefocus=this.hasfocus=this.zoomactive=this.zoom=this.selectiondrag=this.cursorfreezed=this.cursor=this.rail=!1;this.visibility=!0;this.hidden=this.locked=this.railslocked=!1;this.cursoractive=!0;this.wheelprevented=!1;this.overflowx=a.opt.overflowx;this.overflowy=a.opt.overflowy;
this.nativescrollingarea=!1;this.checkarea=0;this.events=[];this.saved={};this.delaylist={};this.synclist={};this.lastdeltay=this.lastdeltax=0;this.detected=R();var f=e.extend({},this.detected);this.ishwscroll=(this.canhwscroll=f.hastransform&&a.opt.hwacceleration)&&a.haswrapper;this.hasreversehr=this.isrtlmode&&!f.iswebkit;this.istouchcapable=!1;!f.cantouch||f.isios||f.isandroid||!f.iswebkit&&!f.ismozilla||(this.istouchcapable=!0,f.cantouch=!1);a.opt.enablemouselockapi||(f.hasmousecapture=!1,f.haspointerlock=
!1);this.debounced=function(b,g,c){var d=a.delaylist[b];a.delaylist[b]=g;d||(a.debouncedelayed=setTimeout(function(){if(a){var g=a.delaylist[b];a.delaylist[b]=!1;g.call(a)}},c))};var t=!1;this.synched=function(b,g){a.synclist[b]=g;(function(){t||(u(function(){t=!1;for(var b in a.synclist){var g=a.synclist[b];g&&g.call(a);a.synclist[b]=!1}}),t=!0)})();return b};this.unsynched=function(b){a.synclist[b]&&(a.synclist[b]=!1)};this.css=function(b,g){for(var c in g)a.saved.css.push([b,c,b.css(c)]),b.css(c,
g[c])};this.scrollTop=function(b){return"undefined"==typeof b?a.getScrollTop():a.setScrollTop(b)};this.scrollLeft=function(b){return"undefined"==typeof b?a.getScrollLeft():a.setScrollLeft(b)};var B=function(a,g,c,d,f,e,h){this.st=a;this.ed=g;this.spd=c;this.p1=d||0;this.p2=f||1;this.p3=e||0;this.p4=h||1;this.ts=(new Date).getTime();this.df=this.ed-this.st};B.prototype={B2:function(a){return 3*a*a*(1-a)},B3:function(a){return 3*a*(1-a)*(1-a)},B4:function(a){return(1-a)*(1-a)*(1-a)},getNow:function(){var a=
1-((new Date).getTime()-this.ts)/this.spd,g=this.B2(a)+this.B3(a)+this.B4(a);return 0>a?this.ed:this.st+Math.round(this.df*g)},update:function(a,g){this.st=this.getNow();this.ed=a;this.spd=g;this.ts=(new Date).getTime();this.df=this.ed-this.st;return this}};if(this.ishwscroll){this.doc.translate={x:0,y:0,tx:"0px",ty:"0px"};f.hastranslate3d&&f.isios&&this.doc.css("-webkit-backface-visibility","hidden");this.getScrollTop=function(b){if(!b){if(b=h())return 16==b.length?-b[13]:-b[5];if(a.timerscroll&&
a.timerscroll.bz)return a.timerscroll.bz.getNow()}return a.doc.translate.y};this.getScrollLeft=function(b){if(!b){if(b=h())return 16==b.length?-b[12]:-b[4];if(a.timerscroll&&a.timerscroll.bh)return a.timerscroll.bh.getNow()}return a.doc.translate.x};this.notifyScrollEvent=function(a){var g=document.createEvent("UIEvents");g.initUIEvent("scroll",!1,!0,window,1);g.niceevent=!0;a.dispatchEvent(g)};var L=this.isrtlmode?1:-1;f.hastranslate3d&&a.opt.enabletranslate3d?(this.setScrollTop=function(b,g){a.doc.translate.y=
b;a.doc.translate.ty=-1*b+"px";a.doc.css(f.trstyle,"translate3d("+a.doc.translate.tx+","+a.doc.translate.ty+",0px)");g||a.notifyScrollEvent(a.win[0])},this.setScrollLeft=function(b,g){a.doc.translate.x=b;a.doc.translate.tx=b*L+"px";a.doc.css(f.trstyle,"translate3d("+a.doc.translate.tx+","+a.doc.translate.ty+",0px)");g||a.notifyScrollEvent(a.win[0])}):(this.setScrollTop=function(b,g){a.doc.translate.y=b;a.doc.translate.ty=-1*b+"px";a.doc.css(f.trstyle,"translate("+a.doc.translate.tx+","+a.doc.translate.ty+
")");g||a.notifyScrollEvent(a.win[0])},this.setScrollLeft=function(b,g){a.doc.translate.x=b;a.doc.translate.tx=b*L+"px";a.doc.css(f.trstyle,"translate("+a.doc.translate.tx+","+a.doc.translate.ty+")");g||a.notifyScrollEvent(a.win[0])})}else this.getScrollTop=function(){return a.docscroll.scrollTop()},this.setScrollTop=function(b){return setTimeout(function(){a.docscroll.scrollTop(b)},1)},this.getScrollLeft=function(){return a.detected.ismozilla&&a.isrtlmode?Math.abs(a.docscroll.scrollLeft()):a.docscroll.scrollLeft()},
this.setScrollLeft=function(b){return setTimeout(function(){a.docscroll.scrollLeft(a.detected.ismozilla&&a.isrtlmode?-b:b)},1)};this.getTarget=function(a){return a?a.target?a.target:a.srcElement?a.srcElement:!1:!1};this.hasParent=function(a,g){if(!a)return!1;for(var c=a.target||a.srcElement||a||!1;c&&c.id!=g;)c=c.parentNode||!1;return!1!==c};var y={thin:1,medium:3,thick:5};this.getDocumentScrollOffset=function(){return{top:window.pageYOffset||document.documentElement.scrollTop,left:window.pageXOffset||
document.documentElement.scrollLeft}};this.getOffset=function(){if(a.isfixed){var b=a.win.offset(),g=a.getDocumentScrollOffset();b.top-=g.top;b.left-=g.left;return b}b=a.win.offset();if(!a.viewport)return b;g=a.viewport.offset();return{top:b.top-g.top,left:b.left-g.left}};this.updateScrollBar=function(b){if(a.ishwscroll)a.rail.css({height:a.win.innerHeight()-(a.opt.railpadding.top+a.opt.railpadding.bottom)}),a.railh&&a.railh.css({width:a.win.innerWidth()-(a.opt.railpadding.left+a.opt.railpadding.right)});
else{var g=a.getOffset(),c=g.top,f=g.left-(a.opt.railpadding.left+a.opt.railpadding.right),c=c+d(a.win,"border-top-width",!0),f=f+(a.rail.align?a.win.outerWidth()-d(a.win,"border-right-width")-a.rail.width:d(a.win,"border-left-width")),e=a.opt.railoffset;e&&(e.top&&(c+=e.top),e.left&&(f+=e.left));a.railslocked||a.rail.css({top:c,left:f,height:(b?b.h:a.win.innerHeight())-(a.opt.railpadding.top+a.opt.railpadding.bottom)});a.zoom&&a.zoom.css({top:c+1,left:1==a.rail.align?f-20:f+a.rail.width+4});if(a.railh&&
!a.railslocked){c=g.top;f=g.left;if(e=a.opt.railhoffset)e.top&&(c+=e.top),e.left&&(f+=e.left);b=a.railh.align?c+d(a.win,"border-top-width",!0)+a.win.innerHeight()-a.railh.height:c+d(a.win,"border-top-width",!0);f+=d(a.win,"border-left-width");a.railh.css({top:b-(a.opt.railpadding.top+a.opt.railpadding.bottom),left:f,width:a.railh.width})}}};this.doRailClick=function(b,g,c){var f;a.railslocked||(a.cancelEvent(b),g?(g=c?a.doScrollLeft:a.doScrollTop,f=c?(b.pageX-a.railh.offset().left-a.cursorwidth/2)*
a.scrollratio.x:(b.pageY-a.rail.offset().top-a.cursorheight/2)*a.scrollratio.y,g(f)):(g=c?a.doScrollLeftBy:a.doScrollBy,f=c?a.scroll.x:a.scroll.y,b=c?b.pageX-a.railh.offset().left:b.pageY-a.rail.offset().top,c=c?a.view.w:a.view.h,g(f>=b?c:-c)))};a.hasanimationframe=u;a.hascancelanimationframe=v;a.hasanimationframe?a.hascancelanimationframe||(v=function(){a.cancelAnimationFrame=!0}):(u=function(a){return setTimeout(a,15-Math.floor(+new Date/1E3)%16)},v=clearInterval);this.init=function(){a.saved.css=
[];if(f.isie7mobile||f.isoperamini)return!0;f.hasmstouch&&a.css(a.ispage?e("html"):a.win,{"-ms-touch-action":"none"});a.zindex="auto";a.zindex=a.ispage||"auto"!=a.opt.zindex?a.opt.zindex:n()||"auto";!a.ispage&&"auto"!=a.zindex&&a.zindex>z&&(z=a.zindex);a.isie&&0==a.zindex&&"auto"==a.opt.zindex&&(a.zindex="auto");if(!a.ispage||!f.cantouch&&!f.isieold&&!f.isie9mobile){var b=a.docscroll;a.ispage&&(b=a.haswrapper?a.win:a.doc);f.isie9mobile||a.css(b,{"overflow-y":"hidden"});a.ispage&&f.isie7&&("BODY"==
a.doc[0].nodeName?a.css(e("html"),{"overflow-y":"hidden"}):"HTML"==a.doc[0].nodeName&&a.css(e("body"),{"overflow-y":"hidden"}));!f.isios||a.ispage||a.haswrapper||a.css(e("body"),{"-webkit-overflow-scrolling":"touch"});var c=e(document.createElement("div"));c.css({position:"relative",top:0,"float":"right",width:a.opt.cursorwidth,height:"0px","background-color":a.opt.cursorcolor,border:a.opt.cursorborder,"background-clip":"padding-box","-webkit-border-radius":a.opt.cursorborderradius,"-moz-border-radius":a.opt.cursorborderradius,
"border-radius":a.opt.cursorborderradius});c.hborder=parseFloat(c.outerHeight()-c.innerHeight());c.addClass("nicescroll-cursors");a.cursor=c;var l=e(document.createElement("div"));l.attr("id",a.id);l.addClass("nicescroll-rails nicescroll-rails-vr");var d,h,k=["left","right","top","bottom"],K;for(K in k)h=k[K],(d=a.opt.railpadding[h])?l.css("padding-"+h,d+"px"):a.opt.railpadding[h]=0;l.append(c);l.width=Math.max(parseFloat(a.opt.cursorwidth),c.outerWidth());l.css({width:l.width+"px",zIndex:a.zindex,
background:a.opt.background,cursor:"default"});l.visibility=!0;l.scrollable=!0;l.align="left"==a.opt.railalign?0:1;a.rail=l;c=a.rail.drag=!1;!a.opt.boxzoom||a.ispage||f.isieold||(c=document.createElement("div"),a.bind(c,"click",a.doZoom),a.bind(c,"mouseenter",function(){a.zoom.css("opacity",a.opt.cursoropacitymax)}),a.bind(c,"mouseleave",function(){a.zoom.css("opacity",a.opt.cursoropacitymin)}),a.zoom=e(c),a.zoom.css({cursor:"pointer","z-index":a.zindex,backgroundImage:"url("+a.opt.scriptpath+"zoomico.png)",
height:18,width:18,backgroundPosition:"0px 0px"}),a.opt.dblclickzoom&&a.bind(a.win,"dblclick",a.doZoom),f.cantouch&&a.opt.gesturezoom&&(a.ongesturezoom=function(b){1.5<b.scale&&a.doZoomIn(b);.8>b.scale&&a.doZoomOut(b);return a.cancelEvent(b)},a.bind(a.win,"gestureend",a.ongesturezoom)));a.railh=!1;var m;a.opt.horizrailenabled&&(a.css(b,{"overflow-x":"hidden"}),c=e(document.createElement("div")),c.css({position:"absolute",top:0,height:a.opt.cursorwidth,width:"0px","background-color":a.opt.cursorcolor,
border:a.opt.cursorborder,"background-clip":"padding-box","-webkit-border-radius":a.opt.cursorborderradius,"-moz-border-radius":a.opt.cursorborderradius,"border-radius":a.opt.cursorborderradius}),f.isieold&&c.css({overflow:"hidden"}),c.wborder=parseFloat(c.outerWidth()-c.innerWidth()),c.addClass("nicescroll-cursors"),a.cursorh=c,m=e(document.createElement("div")),m.attr("id",a.id+"-hr"),m.addClass("nicescroll-rails nicescroll-rails-hr"),m.height=Math.max(parseFloat(a.opt.cursorwidth),c.outerHeight()),
m.css({height:m.height+"px",zIndex:a.zindex,background:a.opt.background}),m.append(c),m.visibility=!0,m.scrollable=!0,m.align="top"==a.opt.railvalign?0:1,a.railh=m,a.railh.drag=!1);a.ispage?(l.css({position:"fixed",top:"0px",height:"100%"}),l.align?l.css({right:"0px"}):l.css({left:"0px"}),a.body.append(l),a.railh&&(m.css({position:"fixed",left:"0px",width:"100%"}),m.align?m.css({bottom:"0px"}):m.css({top:"0px"}),a.body.append(m))):(a.ishwscroll?("static"==a.win.css("position")&&a.css(a.win,{position:"relative"}),
b="HTML"==a.win[0].nodeName?a.body:a.win,e(b).scrollTop(0).scrollLeft(0),a.zoom&&(a.zoom.css({position:"absolute",top:1,right:0,"margin-right":l.width+4}),b.append(a.zoom)),l.css({position:"absolute",top:0}),l.align?l.css({right:0}):l.css({left:0}),b.append(l),m&&(m.css({position:"absolute",left:0,bottom:0}),m.align?m.css({bottom:0}):m.css({top:0}),b.append(m))):(a.isfixed="fixed"==a.win.css("position"),b=a.isfixed?"fixed":"absolute",a.isfixed||(a.viewport=a.getViewport(a.win[0])),a.viewport&&(a.body=
a.viewport,0==/fixed|absolute/.test(a.viewport.css("position"))&&a.css(a.viewport,{position:"relative"})),l.css({position:b}),a.zoom&&a.zoom.css({position:b}),a.updateScrollBar(),a.body.append(l),a.zoom&&a.body.append(a.zoom),a.railh&&(m.css({position:b}),a.body.append(m))),f.isios&&a.css(a.win,{"-webkit-tap-highlight-color":"rgba(0,0,0,0)","-webkit-touch-callout":"none"}),f.isie&&a.opt.disableoutline&&a.win.attr("hideFocus","true"),f.iswebkit&&a.opt.disableoutline&&a.win.css({outline:"none"}));!1===
a.opt.autohidemode?(a.autohidedom=!1,a.rail.css({opacity:a.opt.cursoropacitymax}),a.railh&&a.railh.css({opacity:a.opt.cursoropacitymax})):!0===a.opt.autohidemode||"leave"===a.opt.autohidemode?(a.autohidedom=e().add(a.rail),f.isie8&&(a.autohidedom=a.autohidedom.add(a.cursor)),a.railh&&(a.autohidedom=a.autohidedom.add(a.railh)),a.railh&&f.isie8&&(a.autohidedom=a.autohidedom.add(a.cursorh))):"scroll"==a.opt.autohidemode?(a.autohidedom=e().add(a.rail),a.railh&&(a.autohidedom=a.autohidedom.add(a.railh))):
"cursor"==a.opt.autohidemode?(a.autohidedom=e().add(a.cursor),a.railh&&(a.autohidedom=a.autohidedom.add(a.cursorh))):"hidden"==a.opt.autohidemode&&(a.autohidedom=!1,a.hide(),a.railslocked=!1);if(f.isie9mobile)a.scrollmom=new M(a),a.onmangotouch=function(){var b=a.getScrollTop(),c=a.getScrollLeft();if(b==a.scrollmom.lastscrolly&&c==a.scrollmom.lastscrollx)return!0;var g=b-a.mangotouch.sy,f=c-a.mangotouch.sx;if(0!=Math.round(Math.sqrt(Math.pow(f,2)+Math.pow(g,2)))){var d=0>g?-1:1,l=0>f?-1:1,e=+new Date;
a.mangotouch.lazy&&clearTimeout(a.mangotouch.lazy);80<e-a.mangotouch.tm||a.mangotouch.dry!=d||a.mangotouch.drx!=l?(a.scrollmom.stop(),a.scrollmom.reset(c,b),a.mangotouch.sy=b,a.mangotouch.ly=b,a.mangotouch.sx=c,a.mangotouch.lx=c,a.mangotouch.dry=d,a.mangotouch.drx=l,a.mangotouch.tm=e):(a.scrollmom.stop(),a.scrollmom.update(a.mangotouch.sx-f,a.mangotouch.sy-g),a.mangotouch.tm=e,g=Math.max(Math.abs(a.mangotouch.ly-b),Math.abs(a.mangotouch.lx-c)),a.mangotouch.ly=b,a.mangotouch.lx=c,2<g&&(a.mangotouch.lazy=
setTimeout(function(){a.mangotouch.lazy=!1;a.mangotouch.dry=0;a.mangotouch.drx=0;a.mangotouch.tm=0;a.scrollmom.doMomentum(30)},100)))}},l=a.getScrollTop(),m=a.getScrollLeft(),a.mangotouch={sy:l,ly:l,dry:0,sx:m,lx:m,drx:0,lazy:!1,tm:0},a.bind(a.docscroll,"scroll",a.onmangotouch);else{if(f.cantouch||a.istouchcapable||a.opt.touchbehavior||f.hasmstouch){a.scrollmom=new M(a);a.ontouchstart=function(b){if(b.pointerType&&2!=b.pointerType&&"touch"!=b.pointerType)return!1;a.hasmoving=!1;if(!a.railslocked){var c;
if(f.hasmstouch)for(c=b.target?b.target:!1;c;){var g=e(c).getNiceScroll();if(0<g.length&&g[0].me==a.me)break;if(0<g.length)return!1;if("DIV"==c.nodeName&&c.id==a.id)break;c=c.parentNode?c.parentNode:!1}a.cancelScroll();if((c=a.getTarget(b))&&/INPUT/i.test(c.nodeName)&&/range/i.test(c.type))return a.stopPropagation(b);!("clientX"in b)&&"changedTouches"in b&&(b.clientX=b.changedTouches[0].clientX,b.clientY=b.changedTouches[0].clientY);a.forcescreen&&(g=b,b={original:b.original?b.original:b},b.clientX=
g.screenX,b.clientY=g.screenY);a.rail.drag={x:b.clientX,y:b.clientY,sx:a.scroll.x,sy:a.scroll.y,st:a.getScrollTop(),sl:a.getScrollLeft(),pt:2,dl:!1};if(a.ispage||!a.opt.directionlockdeadzone)a.rail.drag.dl="f";else{var g=e(window).width(),d=e(window).height(),d=Math.max(0,Math.max(document.body.scrollHeight,document.documentElement.scrollHeight)-d),g=Math.max(0,Math.max(document.body.scrollWidth,document.documentElement.scrollWidth)-g);a.rail.drag.ck=!a.rail.scrollable&&a.railh.scrollable?0<d?"v":
!1:a.rail.scrollable&&!a.railh.scrollable?0<g?"h":!1:!1;a.rail.drag.ck||(a.rail.drag.dl="f")}a.opt.touchbehavior&&a.isiframe&&f.isie&&(g=a.win.position(),a.rail.drag.x+=g.left,a.rail.drag.y+=g.top);a.hasmoving=!1;a.lastmouseup=!1;a.scrollmom.reset(b.clientX,b.clientY);if(!f.cantouch&&!this.istouchcapable&&!b.pointerType){if(!c||!/INPUT|SELECT|TEXTAREA/i.test(c.nodeName))return!a.ispage&&f.hasmousecapture&&c.setCapture(),a.opt.touchbehavior?(c.onclick&&!c._onclick&&(c._onclick=c.onclick,c.onclick=
function(b){if(a.hasmoving)return!1;c._onclick.call(this,b)}),a.cancelEvent(b)):a.stopPropagation(b);/SUBMIT|CANCEL|BUTTON/i.test(e(c).attr("type"))&&(pc={tg:c,click:!1},a.preventclick=pc)}}};a.ontouchend=function(b){if(!a.rail.drag)return!0;if(2==a.rail.drag.pt){if(b.pointerType&&2!=b.pointerType&&"touch"!=b.pointerType)return!1;a.scrollmom.doMomentum();a.rail.drag=!1;if(a.hasmoving&&(a.lastmouseup=!0,a.hideCursor(),f.hasmousecapture&&document.releaseCapture(),!f.cantouch))return a.cancelEvent(b)}else if(1==
a.rail.drag.pt)return a.onmouseup(b)};var p=a.opt.touchbehavior&&a.isiframe&&!f.hasmousecapture;a.ontouchmove=function(b,c){if(!a.rail.drag||b.targetTouches&&a.opt.preventmultitouchscrolling&&1<b.targetTouches.length||b.pointerType&&2!=b.pointerType&&"touch"!=b.pointerType)return!1;if(2==a.rail.drag.pt){if(f.cantouch&&f.isios&&"undefined"==typeof b.original)return!0;a.hasmoving=!0;a.preventclick&&!a.preventclick.click&&(a.preventclick.click=a.preventclick.tg.onclick||!1,a.preventclick.tg.onclick=
a.onpreventclick);b=e.extend({original:b},b);"changedTouches"in b&&(b.clientX=b.changedTouches[0].clientX,b.clientY=b.changedTouches[0].clientY);if(a.forcescreen){var g=b;b={original:b.original?b.original:b};b.clientX=g.screenX;b.clientY=g.screenY}var d,g=d=0;p&&!c&&(d=a.win.position(),g=-d.left,d=-d.top);var l=b.clientY+d;d=l-a.rail.drag.y;var h=b.clientX+g,w=h-a.rail.drag.x,k=a.rail.drag.st-d;a.ishwscroll&&a.opt.bouncescroll?0>k?k=Math.round(k/2):k>a.page.maxh&&(k=a.page.maxh+Math.round((k-a.page.maxh)/
2)):(0>k&&(l=k=0),k>a.page.maxh&&(k=a.page.maxh,l=0));var r;a.railh&&a.railh.scrollable&&(r=a.isrtlmode?w-a.rail.drag.sl:a.rail.drag.sl-w,a.ishwscroll&&a.opt.bouncescroll?0>r?r=Math.round(r/2):r>a.page.maxw&&(r=a.page.maxw+Math.round((r-a.page.maxw)/2)):(0>r&&(h=r=0),r>a.page.maxw&&(r=a.page.maxw,h=0)));g=!1;if(a.rail.drag.dl)g=!0,"v"==a.rail.drag.dl?r=a.rail.drag.sl:"h"==a.rail.drag.dl&&(k=a.rail.drag.st);else{d=Math.abs(d);var w=Math.abs(w),m=a.opt.directionlockdeadzone;if("v"==a.rail.drag.ck){if(d>
m&&w<=.3*d)return a.rail.drag=!1,!0;w>m&&(a.rail.drag.dl="f",e("body").scrollTop(e("body").scrollTop()))}else if("h"==a.rail.drag.ck){if(w>m&&d<=.3*w)return a.rail.drag=!1,!0;d>m&&(a.rail.drag.dl="f",e("body").scrollLeft(e("body").scrollLeft()))}}a.synched("touchmove",function(){a.rail.drag&&2==a.rail.drag.pt&&(a.prepareTransition&&a.prepareTransition(0),a.rail.scrollable&&a.setScrollTop(k),a.scrollmom.update(h,l),a.railh&&a.railh.scrollable?(a.setScrollLeft(r),a.showCursor(k,r)):a.showCursor(k),
f.isie10&&document.selection.clear())});f.ischrome&&a.istouchcapable&&(g=!1);if(g)return a.cancelEvent(b)}else if(1==a.rail.drag.pt)return a.onmousemove(b)}}a.onmousedown=function(b,c){if(!a.rail.drag||1==a.rail.drag.pt){if(a.railslocked)return a.cancelEvent(b);a.cancelScroll();a.rail.drag={x:b.clientX,y:b.clientY,sx:a.scroll.x,sy:a.scroll.y,pt:1,hr:!!c};var g=a.getTarget(b);!a.ispage&&f.hasmousecapture&&g.setCapture();a.isiframe&&!f.hasmousecapture&&(a.saved.csspointerevents=a.doc.css("pointer-events"),
a.css(a.doc,{"pointer-events":"none"}));a.hasmoving=!1;return a.cancelEvent(b)}};a.onmouseup=function(b){if(a.rail.drag){if(1!=a.rail.drag.pt)return!0;f.hasmousecapture&&document.releaseCapture();a.isiframe&&!f.hasmousecapture&&a.doc.css("pointer-events",a.saved.csspointerevents);a.rail.drag=!1;a.hasmoving&&a.triggerScrollEnd();return a.cancelEvent(b)}};a.onmousemove=function(b){if(a.rail.drag){if(1==a.rail.drag.pt){if(f.ischrome&&0==b.which)return a.onmouseup(b);a.cursorfreezed=!0;a.hasmoving=!0;
if(a.rail.drag.hr){a.scroll.x=a.rail.drag.sx+(b.clientX-a.rail.drag.x);0>a.scroll.x&&(a.scroll.x=0);var c=a.scrollvaluemaxw;a.scroll.x>c&&(a.scroll.x=c)}else a.scroll.y=a.rail.drag.sy+(b.clientY-a.rail.drag.y),0>a.scroll.y&&(a.scroll.y=0),c=a.scrollvaluemax,a.scroll.y>c&&(a.scroll.y=c);a.synched("mousemove",function(){a.rail.drag&&1==a.rail.drag.pt&&(a.showCursor(),a.rail.drag.hr?a.hasreversehr?a.doScrollLeft(a.scrollvaluemaxw-Math.round(a.scroll.x*a.scrollratio.x),a.opt.cursordragspeed):a.doScrollLeft(Math.round(a.scroll.x*
a.scrollratio.x),a.opt.cursordragspeed):a.doScrollTop(Math.round(a.scroll.y*a.scrollratio.y),a.opt.cursordragspeed))});return a.cancelEvent(b)}}else a.checkarea=0};if(f.cantouch||a.opt.touchbehavior)a.onpreventclick=function(b){if(a.preventclick)return a.preventclick.tg.onclick=a.preventclick.click,a.preventclick=!1,a.cancelEvent(b)},a.bind(a.win,"mousedown",a.ontouchstart),a.onclick=f.isios?!1:function(b){return a.lastmouseup?(a.lastmouseup=!1,a.cancelEvent(b)):!0},a.opt.grabcursorenabled&&f.cursorgrabvalue&&
(a.css(a.ispage?a.doc:a.win,{cursor:f.cursorgrabvalue}),a.css(a.rail,{cursor:f.cursorgrabvalue}));else{var q=function(b){if(a.selectiondrag){if(b){var c=a.win.outerHeight();b=b.pageY-a.selectiondrag.top;0<b&&b<c&&(b=0);b>=c&&(b-=c);a.selectiondrag.df=b}0!=a.selectiondrag.df&&(a.doScrollBy(2*-Math.floor(a.selectiondrag.df/6)),a.debounced("doselectionscroll",function(){q()},50))}};a.hasTextSelected="getSelection"in document?function(){return 0<document.getSelection().rangeCount}:"selection"in document?
function(){return"None"!=document.selection.type}:function(){return!1};a.onselectionstart=function(b){a.ispage||(a.selectiondrag=a.win.offset())};a.onselectionend=function(b){a.selectiondrag=!1};a.onselectiondrag=function(b){a.selectiondrag&&a.hasTextSelected()&&a.debounced("selectionscroll",function(){q(b)},250)}}f.hasw3ctouch?(a.css(a.rail,{"touch-action":"none"}),a.css(a.cursor,{"touch-action":"none"}),a.bind(a.win,"pointerdown",a.ontouchstart),a.bind(document,"pointerup",a.ontouchend),a.bind(document,
"pointermove",a.ontouchmove)):f.hasmstouch?(a.css(a.rail,{"-ms-touch-action":"none"}),a.css(a.cursor,{"-ms-touch-action":"none"}),a.bind(a.win,"MSPointerDown",a.ontouchstart),a.bind(document,"MSPointerUp",a.ontouchend),a.bind(document,"MSPointerMove",a.ontouchmove),a.bind(a.cursor,"MSGestureHold",function(a){a.preventDefault()}),a.bind(a.cursor,"contextmenu",function(a){a.preventDefault()})):this.istouchcapable&&(a.bind(a.win,"touchstart",a.ontouchstart),a.bind(document,"touchend",a.ontouchend),a.bind(document,
"touchcancel",a.ontouchend),a.bind(document,"touchmove",a.ontouchmove));if(a.opt.cursordragontouch||!f.cantouch&&!a.opt.touchbehavior)a.rail.css({cursor:"default"}),a.railh&&a.railh.css({cursor:"default"}),a.jqbind(a.rail,"mouseenter",function(){if(!a.ispage&&!a.win.is(":visible"))return!1;a.canshowonmouseevent&&a.showCursor();a.rail.active=!0}),a.jqbind(a.rail,"mouseleave",function(){a.rail.active=!1;a.rail.drag||a.hideCursor()}),a.opt.sensitiverail&&(a.bind(a.rail,"click",function(b){a.doRailClick(b,
!1,!1)}),a.bind(a.rail,"dblclick",function(b){a.doRailClick(b,!0,!1)}),a.bind(a.cursor,"click",function(b){a.cancelEvent(b)}),a.bind(a.cursor,"dblclick",function(b){a.cancelEvent(b)})),a.railh&&(a.jqbind(a.railh,"mouseenter",function(){if(!a.ispage&&!a.win.is(":visible"))return!1;a.canshowonmouseevent&&a.showCursor();a.rail.active=!0}),a.jqbind(a.railh,"mouseleave",function(){a.rail.active=!1;a.rail.drag||a.hideCursor()}),a.opt.sensitiverail&&(a.bind(a.railh,"click",function(b){a.doRailClick(b,!1,
!0)}),a.bind(a.railh,"dblclick",function(b){a.doRailClick(b,!0,!0)}),a.bind(a.cursorh,"click",function(b){a.cancelEvent(b)}),a.bind(a.cursorh,"dblclick",function(b){a.cancelEvent(b)})));f.cantouch||a.opt.touchbehavior?(a.bind(f.hasmousecapture?a.win:document,"mouseup",a.ontouchend),a.bind(document,"mousemove",a.ontouchmove),a.onclick&&a.bind(document,"click",a.onclick),a.opt.cursordragontouch&&(a.bind(a.cursor,"mousedown",a.onmousedown),a.bind(a.cursor,"mouseup",a.onmouseup),a.cursorh&&a.bind(a.cursorh,
"mousedown",function(b){a.onmousedown(b,!0)}),a.cursorh&&a.bind(a.cursorh,"mouseup",a.onmouseup))):(a.bind(f.hasmousecapture?a.win:document,"mouseup",a.onmouseup),a.bind(document,"mousemove",a.onmousemove),a.onclick&&a.bind(document,"click",a.onclick),a.bind(a.cursor,"mousedown",a.onmousedown),a.bind(a.cursor,"mouseup",a.onmouseup),a.railh&&(a.bind(a.cursorh,"mousedown",function(b){a.onmousedown(b,!0)}),a.bind(a.cursorh,"mouseup",a.onmouseup)),!a.ispage&&a.opt.enablescrollonselection&&(a.bind(a.win[0],
"mousedown",a.onselectionstart),a.bind(document,"mouseup",a.onselectionend),a.bind(a.cursor,"mouseup",a.onselectionend),a.cursorh&&a.bind(a.cursorh,"mouseup",a.onselectionend),a.bind(document,"mousemove",a.onselectiondrag)),a.zoom&&(a.jqbind(a.zoom,"mouseenter",function(){a.canshowonmouseevent&&a.showCursor();a.rail.active=!0}),a.jqbind(a.zoom,"mouseleave",function(){a.rail.active=!1;a.rail.drag||a.hideCursor()})));a.opt.enablemousewheel&&(a.isiframe||a.bind(f.isie&&a.ispage?document:a.win,"mousewheel",
a.onmousewheel),a.bind(a.rail,"mousewheel",a.onmousewheel),a.railh&&a.bind(a.railh,"mousewheel",a.onmousewheelhr));a.ispage||f.cantouch||/HTML|^BODY/.test(a.win[0].nodeName)||(a.win.attr("tabindex")||a.win.attr({tabindex:O++}),a.jqbind(a.win,"focus",function(b){A=a.getTarget(b).id||!0;a.hasfocus=!0;a.canshowonmouseevent&&a.noticeCursor()}),a.jqbind(a.win,"blur",function(b){A=!1;a.hasfocus=!1}),a.jqbind(a.win,"mouseenter",function(b){E=a.getTarget(b).id||!0;a.hasmousefocus=!0;a.canshowonmouseevent&&
a.noticeCursor()}),a.jqbind(a.win,"mouseleave",function(){E=!1;a.hasmousefocus=!1;a.rail.drag||a.hideCursor()}))}a.onkeypress=function(b){if(a.railslocked&&0==a.page.maxh)return!0;b=b?b:window.e;var c=a.getTarget(b);if(c&&/INPUT|TEXTAREA|SELECT|OPTION/.test(c.nodeName)&&(!c.getAttribute("type")&&!c.type||!/submit|button|cancel/i.tp)||e(c).attr("contenteditable"))return!0;if(a.hasfocus||a.hasmousefocus&&!A||a.ispage&&!A&&!E){c=b.keyCode;if(a.railslocked&&27!=c)return a.cancelEvent(b);var g=b.ctrlKey||
!1,d=b.shiftKey||!1,f=!1;switch(c){case 38:case 63233:a.doScrollBy(72);f=!0;break;case 40:case 63235:a.doScrollBy(-72);f=!0;break;case 37:case 63232:a.railh&&(g?a.doScrollLeft(0):a.doScrollLeftBy(72),f=!0);break;case 39:case 63234:a.railh&&(g?a.doScrollLeft(a.page.maxw):a.doScrollLeftBy(-72),f=!0);break;case 33:case 63276:a.doScrollBy(a.view.h);f=!0;break;case 34:case 63277:a.doScrollBy(-a.view.h);f=!0;break;case 36:case 63273:a.railh&&g?a.doScrollPos(0,0):a.doScrollTo(0);f=!0;break;case 35:case 63275:a.railh&&
g?a.doScrollPos(a.page.maxw,a.page.maxh):a.doScrollTo(a.page.maxh);f=!0;break;case 32:a.opt.spacebarenabled&&(d?a.doScrollBy(a.view.h):a.doScrollBy(-a.view.h),f=!0);break;case 27:a.zoomactive&&(a.doZoom(),f=!0)}if(f)return a.cancelEvent(b)}};a.opt.enablekeyboard&&a.bind(document,f.isopera&&!f.isopera12?"keypress":"keydown",a.onkeypress);a.bind(document,"keydown",function(b){b.ctrlKey&&(a.wheelprevented=!0)});a.bind(document,"keyup",function(b){b.ctrlKey||(a.wheelprevented=!1)});a.bind(window,"blur",
function(b){a.wheelprevented=!1});a.bind(window,"resize",a.lazyResize);a.bind(window,"orientationchange",a.lazyResize);a.bind(window,"load",a.lazyResize);if(f.ischrome&&!a.ispage&&!a.haswrapper){var t=a.win.attr("style"),l=parseFloat(a.win.css("width"))+1;a.win.css("width",l);a.synched("chromefix",function(){a.win.attr("style",t)})}a.onAttributeChange=function(b){a.lazyResize(a.isieold?250:30)};!1!==x&&(a.observerbody=new x(function(b){b.forEach(function(b){if("attributes"==b.type)return e("body").hasClass("modal-open")&&
!e.contains(e(".modal-dialog")[0],a.doc[0])?a.hide():a.show()});if(document.body.scrollHeight!=a.page.maxh)return a.lazyResize(30)}),a.observerbody.observe(document.body,{childList:!0,subtree:!0,characterData:!1,attributes:!0,attributeFilter:["class"]}));a.ispage||a.haswrapper||(!1!==x?(a.observer=new x(function(b){b.forEach(a.onAttributeChange)}),a.observer.observe(a.win[0],{childList:!0,characterData:!1,attributes:!0,subtree:!1}),a.observerremover=new x(function(b){b.forEach(function(b){if(0<b.removedNodes.length)for(var c in b.removedNodes)if(a&&
b.removedNodes[c]==a.win[0])return a.remove()})}),a.observerremover.observe(a.win[0].parentNode,{childList:!0,characterData:!1,attributes:!1,subtree:!1})):(a.bind(a.win,f.isie&&!f.isie9?"propertychange":"DOMAttrModified",a.onAttributeChange),f.isie9&&a.win[0].attachEvent("onpropertychange",a.onAttributeChange),a.bind(a.win,"DOMNodeRemoved",function(b){b.target==a.win[0]&&a.remove()})));!a.ispage&&a.opt.boxzoom&&a.bind(window,"resize",a.resizeZoom);a.istextarea&&(a.bind(a.win,"keydown",a.lazyResize),
a.bind(a.win,"mouseup",a.lazyResize));a.lazyResize(30)}if("IFRAME"==this.doc[0].nodeName){var N=function(){a.iframexd=!1;var b;try{b="contentDocument"in this?this.contentDocument:this.contentWindow.document}catch(c){a.iframexd=!0,b=!1}if(a.iframexd)return"console"in window&&console.log("NiceScroll error: policy restriced iframe"),!0;a.forcescreen=!0;a.isiframe&&(a.iframe={doc:e(b),html:a.doc.contents().find("html")[0],body:a.doc.contents().find("body")[0]},a.getContentSize=function(){return{w:Math.max(a.iframe.html.scrollWidth,
a.iframe.body.scrollWidth),h:Math.max(a.iframe.html.scrollHeight,a.iframe.body.scrollHeight)}},a.docscroll=e(a.iframe.body));if(!f.isios&&a.opt.iframeautoresize&&!a.isiframe){a.win.scrollTop(0);a.doc.height("");var g=Math.max(b.getElementsByTagName("html")[0].scrollHeight,b.body.scrollHeight);a.doc.height(g)}a.lazyResize(30);f.isie7&&a.css(e(a.iframe.html),{"overflow-y":"hidden"});a.css(e(a.iframe.body),{"overflow-y":"hidden"});f.isios&&a.haswrapper&&a.css(e(b.body),{"-webkit-transform":"translate3d(0,0,0)"});
"contentWindow"in this?a.bind(this.contentWindow,"scroll",a.onscroll):a.bind(b,"scroll",a.onscroll);a.opt.enablemousewheel&&a.bind(b,"mousewheel",a.onmousewheel);a.opt.enablekeyboard&&a.bind(b,f.isopera?"keypress":"keydown",a.onkeypress);if(f.cantouch||a.opt.touchbehavior)a.bind(b,"mousedown",a.ontouchstart),a.bind(b,"mousemove",function(b){return a.ontouchmove(b,!0)}),a.opt.grabcursorenabled&&f.cursorgrabvalue&&a.css(e(b.body),{cursor:f.cursorgrabvalue});a.bind(b,"mouseup",a.ontouchend);a.zoom&&
(a.opt.dblclickzoom&&a.bind(b,"dblclick",a.doZoom),a.ongesturezoom&&a.bind(b,"gestureend",a.ongesturezoom))};this.doc[0].readyState&&"complete"==this.doc[0].readyState&&setTimeout(function(){N.call(a.doc[0],!1)},500);a.bind(this.doc,"load",N)}};this.showCursor=function(b,c){a.cursortimeout&&(clearTimeout(a.cursortimeout),a.cursortimeout=0);if(a.rail){a.autohidedom&&(a.autohidedom.stop().css({opacity:a.opt.cursoropacitymax}),a.cursoractive=!0);a.rail.drag&&1==a.rail.drag.pt||("undefined"!=typeof b&&
!1!==b&&(a.scroll.y=Math.round(1*b/a.scrollratio.y)),"undefined"!=typeof c&&(a.scroll.x=Math.round(1*c/a.scrollratio.x)));a.cursor.css({height:a.cursorheight,top:a.scroll.y});if(a.cursorh){var d=a.hasreversehr?a.scrollvaluemaxw-a.scroll.x:a.scroll.x;!a.rail.align&&a.rail.visibility?a.cursorh.css({width:a.cursorwidth,left:d+a.rail.width}):a.cursorh.css({width:a.cursorwidth,left:d});a.cursoractive=!0}a.zoom&&a.zoom.stop().css({opacity:a.opt.cursoropacitymax})}};this.hideCursor=function(b){a.cursortimeout||
!a.rail||!a.autohidedom||a.hasmousefocus&&"leave"==a.opt.autohidemode||(a.cursortimeout=setTimeout(function(){a.rail.active&&a.showonmouseevent||(a.autohidedom.stop().animate({opacity:a.opt.cursoropacitymin}),a.zoom&&a.zoom.stop().animate({opacity:a.opt.cursoropacitymin}),a.cursoractive=!1);a.cursortimeout=0},b||a.opt.hidecursordelay))};this.noticeCursor=function(b,c,d){a.showCursor(c,d);a.rail.active||a.hideCursor(b)};this.getContentSize=a.ispage?function(){return{w:Math.max(document.body.scrollWidth,
document.documentElement.scrollWidth),h:Math.max(document.body.scrollHeight,document.documentElement.scrollHeight)}}:a.haswrapper?function(){return{w:a.doc.outerWidth()+parseInt(a.win.css("paddingLeft"))+parseInt(a.win.css("paddingRight")),h:a.doc.outerHeight()+parseInt(a.win.css("paddingTop"))+parseInt(a.win.css("paddingBottom"))}}:function(){return{w:a.docscroll[0].scrollWidth,h:a.docscroll[0].scrollHeight}};this.onResize=function(b,c){if(!a||!a.win)return!1;if(!a.haswrapper&&!a.ispage){if("none"==
a.win.css("display"))return a.visibility&&a.hideRail().hideRailHr(),!1;a.hidden||a.visibility||a.showRail().showRailHr()}var d=a.page.maxh,f=a.page.maxw,e=a.view.h,h=a.view.w;a.view={w:a.ispage?a.win.width():parseInt(a.win[0].clientWidth),h:a.ispage?a.win.height():parseInt(a.win[0].clientHeight)};a.page=c?c:a.getContentSize();a.page.maxh=Math.max(0,a.page.h-a.view.h);a.page.maxw=Math.max(0,a.page.w-a.view.w);if(a.page.maxh==d&&a.page.maxw==f&&a.view.w==h&&a.view.h==e){if(a.ispage)return a;d=a.win.offset();
if(a.lastposition&&(f=a.lastposition,f.top==d.top&&f.left==d.left))return a;a.lastposition=d}0==a.page.maxh?(a.hideRail(),a.scrollvaluemax=0,a.scroll.y=0,a.scrollratio.y=0,a.cursorheight=0,a.setScrollTop(0),a.rail&&(a.rail.scrollable=!1)):(a.page.maxh-=a.opt.railpadding.top+a.opt.railpadding.bottom,a.rail.scrollable=!0);0==a.page.maxw?(a.hideRailHr(),a.scrollvaluemaxw=0,a.scroll.x=0,a.scrollratio.x=0,a.cursorwidth=0,a.setScrollLeft(0),a.railh&&(a.railh.scrollable=!1)):(a.page.maxw-=a.opt.railpadding.left+
a.opt.railpadding.right,a.railh&&(a.railh.scrollable=a.opt.horizrailenabled));a.railslocked=a.locked||0==a.page.maxh&&0==a.page.maxw;if(a.railslocked)return a.ispage||a.updateScrollBar(a.view),!1;a.hidden||a.visibility?!a.railh||a.hidden||a.railh.visibility||a.showRailHr():a.showRail().showRailHr();a.istextarea&&a.win.css("resize")&&"none"!=a.win.css("resize")&&(a.view.h-=20);a.cursorheight=Math.min(a.view.h,Math.round(a.view.h/a.page.h*a.view.h));a.cursorheight=a.opt.cursorfixedheight?a.opt.cursorfixedheight:
Math.max(a.opt.cursorminheight,a.cursorheight);a.cursorwidth=Math.min(a.view.w,Math.round(a.view.w/a.page.w*a.view.w));a.cursorwidth=a.opt.cursorfixedheight?a.opt.cursorfixedheight:Math.max(a.opt.cursorminheight,a.cursorwidth);a.scrollvaluemax=a.view.h-a.cursorheight-a.cursor.hborder-(a.opt.railpadding.top+a.opt.railpadding.bottom);a.railh&&(a.railh.width=0<a.page.maxh?a.view.w-a.rail.width:a.view.w,a.scrollvaluemaxw=a.railh.width-a.cursorwidth-a.cursorh.wborder-(a.opt.railpadding.left+a.opt.railpadding.right));
a.ispage||a.updateScrollBar(a.view);a.scrollratio={x:a.page.maxw/a.scrollvaluemaxw,y:a.page.maxh/a.scrollvaluemax};a.getScrollTop()>a.page.maxh?a.doScrollTop(a.page.maxh):(a.scroll.y=Math.round(a.getScrollTop()*(1/a.scrollratio.y)),a.scroll.x=Math.round(a.getScrollLeft()*(1/a.scrollratio.x)),a.cursoractive&&a.noticeCursor());a.scroll.y&&0==a.getScrollTop()&&a.doScrollTo(Math.floor(a.scroll.y*a.scrollratio.y));return a};this.resize=a.onResize;this.lazyResize=function(b){b=isNaN(b)?30:b;a.debounced("resize",
a.resize,b);return a};this.jqbind=function(b,c,d){a.events.push({e:b,n:c,f:d,q:!0});e(b).bind(c,d)};this.bind=function(b,c,d,e){var h="jquery"in b?b[0]:b;"mousewheel"==c?"onwheel"in a.win?a._bind(h,"wheel",d,e||!1):(b="undefined"!=typeof document.onmousewheel?"mousewheel":"DOMMouseScroll",p(h,b,d,e||!1),"DOMMouseScroll"==b&&p(h,"MozMousePixelScroll",d,e||!1)):h.addEventListener?(f.cantouch&&/mouseup|mousedown|mousemove/.test(c)&&a._bind(h,"mousedown"==c?"touchstart":"mouseup"==c?"touchend":"touchmove",
function(a){if(a.touches){if(2>a.touches.length){var b=a.touches.length?a.touches[0]:a;b.original=a;d.call(this,b)}}else a.changedTouches&&(b=a.changedTouches[0],b.original=a,d.call(this,b))},e||!1),a._bind(h,c,d,e||!1),f.cantouch&&"mouseup"==c&&a._bind(h,"touchcancel",d,e||!1)):a._bind(h,c,function(b){(b=b||window.event||!1)&&b.srcElement&&(b.target=b.srcElement);"pageY"in b||(b.pageX=b.clientX+document.documentElement.scrollLeft,b.pageY=b.clientY+document.documentElement.scrollTop);return!1===d.call(h,
b)||!1===e?a.cancelEvent(b):!0})};f.haseventlistener?(this._bind=function(b,c,d,f){a.events.push({e:b,n:c,f:d,b:f,q:!1});b.addEventListener(c,d,f||!1)},this.cancelEvent=function(a){if(!a)return!1;a=a.original?a.original:a;a.preventDefault();a.stopPropagation();a.preventManipulation&&a.preventManipulation();return!1},this.stopPropagation=function(a){if(!a)return!1;a=a.original?a.original:a;a.stopPropagation();return!1},this._unbind=function(a,c,d,f){a.removeEventListener(c,d,f)}):(this._bind=function(b,
c,d,f){a.events.push({e:b,n:c,f:d,b:f,q:!1});b.attachEvent?b.attachEvent("on"+c,d):b["on"+c]=d},this.cancelEvent=function(a){a=window.event||!1;if(!a)return!1;a.cancelBubble=!0;a.cancel=!0;return a.returnValue=!1},this.stopPropagation=function(a){a=window.event||!1;if(!a)return!1;a.cancelBubble=!0;return!1},this._unbind=function(a,c,d,f){a.detachEvent?a.detachEvent("on"+c,d):a["on"+c]=!1});this.unbindAll=function(){for(var b=0;b<a.events.length;b++){var c=a.events[b];c.q?c.e.unbind(c.n,c.f):a._unbind(c.e,
c.n,c.f,c.b)}};this.showRail=function(){0==a.page.maxh||!a.ispage&&"none"==a.win.css("display")||(a.visibility=!0,a.rail.visibility=!0,a.rail.css("display","block"));return a};this.showRailHr=function(){if(!a.railh)return a;0==a.page.maxw||!a.ispage&&"none"==a.win.css("display")||(a.railh.visibility=!0,a.railh.css("display","block"));return a};this.hideRail=function(){a.visibility=!1;a.rail.visibility=!1;a.rail.css("display","none");return a};this.hideRailHr=function(){if(!a.railh)return a;a.railh.visibility=
!1;a.railh.css("display","none");return a};this.show=function(){a.hidden=!1;a.railslocked=!1;return a.showRail().showRailHr()};this.hide=function(){a.hidden=!0;a.railslocked=!0;return a.hideRail().hideRailHr()};this.toggle=function(){return a.hidden?a.show():a.hide()};this.remove=function(){a.stop();a.cursortimeout&&clearTimeout(a.cursortimeout);a.debouncedelayed&&clearTimeout(a.debouncedelayed);a.doZoomOut();a.unbindAll();f.isie9&&a.win[0].detachEvent("onpropertychange",a.onAttributeChange);!1!==
a.observer&&a.observer.disconnect();!1!==a.observerremover&&a.observerremover.disconnect();!1!==a.observerbody&&a.observerbody.disconnect();a.events=null;a.cursor&&a.cursor.remove();a.cursorh&&a.cursorh.remove();a.rail&&a.rail.remove();a.railh&&a.railh.remove();a.zoom&&a.zoom.remove();for(var b=0;b<a.saved.css.length;b++){var c=a.saved.css[b];c[0].css(c[1],"undefined"==typeof c[2]?"":c[2])}a.saved=!1;a.me.data("__nicescroll","");var d=e.nicescroll;d.each(function(b){if(this&&this.id===a.id){delete d[b];
for(var c=++b;c<d.length;c++,b++)d[b]=d[c];d.length--;d.length&&delete d[d.length]}});for(var h in a)a[h]=null,delete a[h];a=null};this.scrollstart=function(b){this.onscrollstart=b;return a};this.scrollend=function(b){this.onscrollend=b;return a};this.scrollcancel=function(b){this.onscrollcancel=b;return a};this.zoomin=function(b){this.onzoomin=b;return a};this.zoomout=function(b){this.onzoomout=b;return a};this.isScrollable=function(a){a=a.target?a.target:a;if("OPTION"==a.nodeName)return!0;for(;a&&
1==a.nodeType&&!/^BODY|HTML/.test(a.nodeName);){var c=e(a),c=c.css("overflowY")||c.css("overflowX")||c.css("overflow")||"";if(/scroll|auto/.test(c))return a.clientHeight!=a.scrollHeight;a=a.parentNode?a.parentNode:!1}return!1};this.getViewport=function(a){for(a=a&&a.parentNode?a.parentNode:!1;a&&1==a.nodeType&&!/^BODY|HTML/.test(a.nodeName);){var c=e(a);if(/fixed|absolute/.test(c.css("position")))return c;var d=c.css("overflowY")||c.css("overflowX")||c.css("overflow")||"";if(/scroll|auto/.test(d)&&
a.clientHeight!=a.scrollHeight||0<c.getNiceScroll().length)return c;a=a.parentNode?a.parentNode:!1}return!1};this.triggerScrollEnd=function(){if(a.onscrollend){var b=a.getScrollLeft(),c=a.getScrollTop();a.onscrollend.call(a,{type:"scrollend",current:{x:b,y:c},end:{x:b,y:c}})}};this.onmousewheel=function(b){if(!a.wheelprevented){if(a.railslocked)return a.debounced("checkunlock",a.resize,250),!0;if(a.rail.drag)return a.cancelEvent(b);"auto"==a.opt.oneaxismousemode&&0!=b.deltaX&&(a.opt.oneaxismousemode=
!1);if(a.opt.oneaxismousemode&&0==b.deltaX&&!a.rail.scrollable)return a.railh&&a.railh.scrollable?a.onmousewheelhr(b):!0;var c=+new Date,d=!1;a.opt.preservenativescrolling&&a.checkarea+600<c&&(a.nativescrollingarea=a.isScrollable(b),d=!0);a.checkarea=c;if(a.nativescrollingarea)return!0;if(b=q(b,!1,d))a.checkarea=0;return b}};this.onmousewheelhr=function(b){if(!a.wheelprevented){if(a.railslocked||!a.railh.scrollable)return!0;if(a.rail.drag)return a.cancelEvent(b);var c=+new Date,d=!1;a.opt.preservenativescrolling&&
a.checkarea+600<c&&(a.nativescrollingarea=a.isScrollable(b),d=!0);a.checkarea=c;return a.nativescrollingarea?!0:a.railslocked?a.cancelEvent(b):q(b,!0,d)}};this.stop=function(){a.cancelScroll();a.scrollmon&&a.scrollmon.stop();a.cursorfreezed=!1;a.scroll.y=Math.round(a.getScrollTop()*(1/a.scrollratio.y));a.noticeCursor();return a};this.getTransitionSpeed=function(b){b=Math.min(Math.round(10*a.opt.scrollspeed),Math.round(b/20*a.opt.scrollspeed));return 20<b?b:0};a.opt.smoothscroll?a.ishwscroll&&f.hastransition&&
a.opt.usetransition&&a.opt.smoothscroll?(this.prepareTransition=function(b,c){var d=c?20<b?b:0:a.getTransitionSpeed(b),e=d?f.prefixstyle+"transform "+d+"ms ease-out":"";a.lasttransitionstyle&&a.lasttransitionstyle==e||(a.lasttransitionstyle=e,a.doc.css(f.transitionstyle,e));return d},this.doScrollLeft=function(b,c){var d=a.scrollrunning?a.newscrolly:a.getScrollTop();a.doScrollPos(b,d,c)},this.doScrollTop=function(b,c){var d=a.scrollrunning?a.newscrollx:a.getScrollLeft();a.doScrollPos(d,b,c)},this.doScrollPos=
function(b,c,d){var e=a.getScrollTop(),h=a.getScrollLeft();(0>(a.newscrolly-e)*(c-e)||0>(a.newscrollx-h)*(b-h))&&a.cancelScroll();0==a.opt.bouncescroll&&(0>c?c=0:c>a.page.maxh&&(c=a.page.maxh),0>b?b=0:b>a.page.maxw&&(b=a.page.maxw));if(a.scrollrunning&&b==a.newscrollx&&c==a.newscrolly)return!1;a.newscrolly=c;a.newscrollx=b;a.newscrollspeed=d||!1;if(a.timer)return!1;a.timer=setTimeout(function(){var d=a.getScrollTop(),e=a.getScrollLeft(),h=Math.round(Math.sqrt(Math.pow(b-e,2)+Math.pow(c-d,2))),h=a.newscrollspeed&&
1<a.newscrollspeed?a.newscrollspeed:a.getTransitionSpeed(h);a.newscrollspeed&&1>=a.newscrollspeed&&(h*=a.newscrollspeed);a.prepareTransition(h,!0);a.timerscroll&&a.timerscroll.tm&&clearInterval(a.timerscroll.tm);0<h&&(!a.scrollrunning&&a.onscrollstart&&a.onscrollstart.call(a,{type:"scrollstart",current:{x:e,y:d},request:{x:b,y:c},end:{x:a.newscrollx,y:a.newscrolly},speed:h}),f.transitionend?a.scrollendtrapped||(a.scrollendtrapped=!0,a.bind(a.doc,f.transitionend,a.onScrollTransitionEnd,!1)):(a.scrollendtrapped&&
clearTimeout(a.scrollendtrapped),a.scrollendtrapped=setTimeout(a.onScrollTransitionEnd,h)),a.timerscroll={bz:new B(d,a.newscrolly,h,0,0,.58,1),bh:new B(e,a.newscrollx,h,0,0,.58,1)},a.cursorfreezed||(a.timerscroll.tm=setInterval(function(){a.showCursor(a.getScrollTop(),a.getScrollLeft())},60)));a.synched("doScroll-set",function(){a.timer=0;a.scrollendtrapped&&(a.scrollrunning=!0);a.setScrollTop(a.newscrolly);a.setScrollLeft(a.newscrollx);if(!a.scrollendtrapped)a.onScrollTransitionEnd()})},50)},this.cancelScroll=
function(){if(!a.scrollendtrapped)return!0;var b=a.getScrollTop(),c=a.getScrollLeft();a.scrollrunning=!1;f.transitionend||clearTimeout(f.transitionend);a.scrollendtrapped=!1;a._unbind(a.doc[0],f.transitionend,a.onScrollTransitionEnd);a.prepareTransition(0);a.setScrollTop(b);a.railh&&a.setScrollLeft(c);a.timerscroll&&a.timerscroll.tm&&clearInterval(a.timerscroll.tm);a.timerscroll=!1;a.cursorfreezed=!1;a.showCursor(b,c);return a},this.onScrollTransitionEnd=function(){a.scrollendtrapped&&a._unbind(a.doc[0],
f.transitionend,a.onScrollTransitionEnd);a.scrollendtrapped=!1;a.prepareTransition(0);a.timerscroll&&a.timerscroll.tm&&clearInterval(a.timerscroll.tm);a.timerscroll=!1;var b=a.getScrollTop(),c=a.getScrollLeft();a.setScrollTop(b);a.railh&&a.setScrollLeft(c);a.noticeCursor(!1,b,c);a.cursorfreezed=!1;0>b?b=0:b>a.page.maxh&&(b=a.page.maxh);0>c?c=0:c>a.page.maxw&&(c=a.page.maxw);if(b!=a.newscrolly||c!=a.newscrollx)return a.doScrollPos(c,b,a.opt.snapbackspeed);a.onscrollend&&a.scrollrunning&&a.triggerScrollEnd();
a.scrollrunning=!1}):(this.doScrollLeft=function(b,c){var d=a.scrollrunning?a.newscrolly:a.getScrollTop();a.doScrollPos(b,d,c)},this.doScrollTop=function(b,c){var d=a.scrollrunning?a.newscrollx:a.getScrollLeft();a.doScrollPos(d,b,c)},this.doScrollPos=function(b,c,d){function f(){if(a.cancelAnimationFrame)return!0;a.scrollrunning=!0;if(q=1-q)return a.timer=u(f)||1;var b=0,c,d,e=d=a.getScrollTop();if(a.dst.ay){e=a.bzscroll?a.dst.py+a.bzscroll.getNow()*a.dst.ay:a.newscrolly;c=e-d;if(0>c&&e<a.newscrolly||
0<c&&e>a.newscrolly)e=a.newscrolly;a.setScrollTop(e);e==a.newscrolly&&(b=1)}else b=1;d=c=a.getScrollLeft();if(a.dst.ax){d=a.bzscroll?a.dst.px+a.bzscroll.getNow()*a.dst.ax:a.newscrollx;c=d-c;if(0>c&&d<a.newscrollx||0<c&&d>a.newscrollx)d=a.newscrollx;a.setScrollLeft(d);d==a.newscrollx&&(b+=1)}else b+=1;2==b?(a.timer=0,a.cursorfreezed=!1,a.bzscroll=!1,a.scrollrunning=!1,0>e?e=0:e>a.page.maxh&&(e=a.page.maxh),0>d?d=0:d>a.page.maxw&&(d=a.page.maxw),d!=a.newscrollx||e!=a.newscrolly?a.doScrollPos(d,e):a.onscrollend&&
a.triggerScrollEnd()):a.timer=u(f)||1}c="undefined"==typeof c||!1===c?a.getScrollTop(!0):c;if(a.timer&&a.newscrolly==c&&a.newscrollx==b)return!0;a.timer&&v(a.timer);a.timer=0;var e=a.getScrollTop(),h=a.getScrollLeft();(0>(a.newscrolly-e)*(c-e)||0>(a.newscrollx-h)*(b-h))&&a.cancelScroll();a.newscrolly=c;a.newscrollx=b;a.bouncescroll&&a.rail.visibility||(0>a.newscrolly?a.newscrolly=0:a.newscrolly>a.page.maxh&&(a.newscrolly=a.page.maxh));a.bouncescroll&&a.railh.visibility||(0>a.newscrollx?a.newscrollx=
0:a.newscrollx>a.page.maxw&&(a.newscrollx=a.page.maxw));a.dst={};a.dst.x=b-h;a.dst.y=c-e;a.dst.px=h;a.dst.py=e;var k=Math.round(Math.sqrt(Math.pow(a.dst.x,2)+Math.pow(a.dst.y,2)));a.dst.ax=a.dst.x/k;a.dst.ay=a.dst.y/k;var n=0,p=k;0==a.dst.x?(n=e,p=c,a.dst.ay=1,a.dst.py=0):0==a.dst.y&&(n=h,p=b,a.dst.ax=1,a.dst.px=0);k=a.getTransitionSpeed(k);d&&1>=d&&(k*=d);a.bzscroll=0<k?a.bzscroll?a.bzscroll.update(p,k):new B(n,p,k,0,1,0,1):!1;if(!a.timer){(e==a.page.maxh&&c>=a.page.maxh||h==a.page.maxw&&b>=a.page.maxw)&&
a.checkContentSize();var q=1;a.cancelAnimationFrame=!1;a.timer=1;a.onscrollstart&&!a.scrollrunning&&a.onscrollstart.call(a,{type:"scrollstart",current:{x:h,y:e},request:{x:b,y:c},end:{x:a.newscrollx,y:a.newscrolly},speed:k});f();(e==a.page.maxh&&c>=e||h==a.page.maxw&&b>=h)&&a.checkContentSize();a.noticeCursor()}},this.cancelScroll=function(){a.timer&&v(a.timer);a.timer=0;a.bzscroll=!1;a.scrollrunning=!1;return a}):(this.doScrollLeft=function(b,c){var d=a.getScrollTop();a.doScrollPos(b,d,c)},this.doScrollTop=
function(b,c){var d=a.getScrollLeft();a.doScrollPos(d,b,c)},this.doScrollPos=function(b,c,d){var f=b>a.page.maxw?a.page.maxw:b;0>f&&(f=0);var e=c>a.page.maxh?a.page.maxh:c;0>e&&(e=0);a.synched("scroll",function(){a.setScrollTop(e);a.setScrollLeft(f)})},this.cancelScroll=function(){});this.doScrollBy=function(b,c){var d=0,d=c?Math.floor((a.scroll.y-b)*a.scrollratio.y):(a.timer?a.newscrolly:a.getScrollTop(!0))-b;if(a.bouncescroll){var f=Math.round(a.view.h/2);d<-f?d=-f:d>a.page.maxh+f&&(d=a.page.maxh+
f)}a.cursorfreezed=!1;f=a.getScrollTop(!0);if(0>d&&0>=f)return a.noticeCursor();if(d>a.page.maxh&&f>=a.page.maxh)return a.checkContentSize(),a.noticeCursor();a.doScrollTop(d)};this.doScrollLeftBy=function(b,c){var d=0,d=c?Math.floor((a.scroll.x-b)*a.scrollratio.x):(a.timer?a.newscrollx:a.getScrollLeft(!0))-b;if(a.bouncescroll){var f=Math.round(a.view.w/2);d<-f?d=-f:d>a.page.maxw+f&&(d=a.page.maxw+f)}a.cursorfreezed=!1;f=a.getScrollLeft(!0);if(0>d&&0>=f||d>a.page.maxw&&f>=a.page.maxw)return a.noticeCursor();
a.doScrollLeft(d)};this.doScrollTo=function(b,c){a.cursorfreezed=!1;a.doScrollTop(b)};this.checkContentSize=function(){var b=a.getContentSize();b.h==a.page.h&&b.w==a.page.w||a.resize(!1,b)};a.onscroll=function(b){a.rail.drag||a.cursorfreezed||a.synched("scroll",function(){a.scroll.y=Math.round(a.getScrollTop()*(1/a.scrollratio.y));a.railh&&(a.scroll.x=Math.round(a.getScrollLeft()*(1/a.scrollratio.x)));a.noticeCursor()})};a.bind(a.docscroll,"scroll",a.onscroll);this.doZoomIn=function(b){if(!a.zoomactive){a.zoomactive=
!0;a.zoomrestore={style:{}};var c="position top left zIndex backgroundColor marginTop marginBottom marginLeft marginRight".split(" "),d=a.win[0].style,h;for(h in c){var k=c[h];a.zoomrestore.style[k]="undefined"!=typeof d[k]?d[k]:""}a.zoomrestore.style.width=a.win.css("width");a.zoomrestore.style.height=a.win.css("height");a.zoomrestore.padding={w:a.win.outerWidth()-a.win.width(),h:a.win.outerHeight()-a.win.height()};f.isios4&&(a.zoomrestore.scrollTop=e(window).scrollTop(),e(window).scrollTop(0));
a.win.css({position:f.isios4?"absolute":"fixed",top:0,left:0,"z-index":z+100,margin:"0px"});c=a.win.css("backgroundColor");(""==c||/transparent|rgba\(0, 0, 0, 0\)|rgba\(0,0,0,0\)/.test(c))&&a.win.css("backgroundColor","#fff");a.rail.css({"z-index":z+101});a.zoom.css({"z-index":z+102});a.zoom.css("backgroundPosition","0px -18px");a.resizeZoom();a.onzoomin&&a.onzoomin.call(a);return a.cancelEvent(b)}};this.doZoomOut=function(b){if(a.zoomactive)return a.zoomactive=!1,a.win.css("margin",""),a.win.css(a.zoomrestore.style),
f.isios4&&e(window).scrollTop(a.zoomrestore.scrollTop),a.rail.css({"z-index":a.zindex}),a.zoom.css({"z-index":a.zindex}),a.zoomrestore=!1,a.zoom.css("backgroundPosition","0px 0px"),a.onResize(),a.onzoomout&&a.onzoomout.call(a),a.cancelEvent(b)};this.doZoom=function(b){return a.zoomactive?a.doZoomOut(b):a.doZoomIn(b)};this.resizeZoom=function(){if(a.zoomactive){var b=a.getScrollTop();a.win.css({width:e(window).width()-a.zoomrestore.padding.w+"px",height:e(window).height()-a.zoomrestore.padding.h+"px"});
a.onResize();a.setScrollTop(Math.min(a.page.maxh,b))}};this.init();e.nicescroll.push(this)},M=function(e){var c=this;this.nc=e;this.steptime=this.lasttime=this.speedy=this.speedx=this.lasty=this.lastx=0;this.snapy=this.snapx=!1;this.demuly=this.demulx=0;this.lastscrolly=this.lastscrollx=-1;this.timer=this.chky=this.chkx=0;this.time=function(){return+new Date};this.reset=function(e,k){c.stop();var d=c.time();c.steptime=0;c.lasttime=d;c.speedx=0;c.speedy=0;c.lastx=e;c.lasty=k;c.lastscrollx=-1;c.lastscrolly=
-1};this.update=function(e,k){var d=c.time();c.steptime=d-c.lasttime;c.lasttime=d;var d=k-c.lasty,p=e-c.lastx,q=c.nc.getScrollTop(),a=c.nc.getScrollLeft(),q=q+d,a=a+p;c.snapx=0>a||a>c.nc.page.maxw;c.snapy=0>q||q>c.nc.page.maxh;c.speedx=p;c.speedy=d;c.lastx=e;c.lasty=k};this.stop=function(){c.nc.unsynched("domomentum2d");c.timer&&clearTimeout(c.timer);c.timer=0;c.lastscrollx=-1;c.lastscrolly=-1};this.doSnapy=function(e,k){var d=!1;0>k?(k=0,d=!0):k>c.nc.page.maxh&&(k=c.nc.page.maxh,d=!0);0>e?(e=0,d=
!0):e>c.nc.page.maxw&&(e=c.nc.page.maxw,d=!0);d?c.nc.doScrollPos(e,k,c.nc.opt.snapbackspeed):c.nc.triggerScrollEnd()};this.doMomentum=function(e){var k=c.time(),d=e?k+e:c.lasttime;e=c.nc.getScrollLeft();var p=c.nc.getScrollTop(),q=c.nc.page.maxh,a=c.nc.page.maxw;c.speedx=0<a?Math.min(60,c.speedx):0;c.speedy=0<q?Math.min(60,c.speedy):0;d=d&&60>=k-d;if(0>p||p>q||0>e||e>a)d=!1;e=c.speedx&&d?c.speedx:!1;if(c.speedy&&d&&c.speedy||e){var u=Math.max(16,c.steptime);50<u&&(e=u/50,c.speedx*=e,c.speedy*=e,u=
50);c.demulxy=0;c.lastscrollx=c.nc.getScrollLeft();c.chkx=c.lastscrollx;c.lastscrolly=c.nc.getScrollTop();c.chky=c.lastscrolly;var f=c.lastscrollx,t=c.lastscrolly,v=function(){var d=600<c.time()-k?.04:.02;c.speedx&&(f=Math.floor(c.lastscrollx-c.speedx*(1-c.demulxy)),c.lastscrollx=f,0>f||f>a)&&(d=.1);c.speedy&&(t=Math.floor(c.lastscrolly-c.speedy*(1-c.demulxy)),c.lastscrolly=t,0>t||t>q)&&(d=.1);c.demulxy=Math.min(1,c.demulxy+d);c.nc.synched("domomentum2d",function(){c.speedx&&(c.nc.getScrollLeft()!=
c.chkx&&c.stop(),c.chkx=f,c.nc.setScrollLeft(f));c.speedy&&(c.nc.getScrollTop()!=c.chky&&c.stop(),c.chky=t,c.nc.setScrollTop(t));c.timer||(c.nc.hideCursor(),c.doSnapy(f,t))});1>c.demulxy?c.timer=setTimeout(v,u):(c.stop(),c.nc.hideCursor(),c.doSnapy(f,t))};v()}else c.doSnapy(c.nc.getScrollLeft(),c.nc.getScrollTop())}},y=e.fn.scrollTop;e.cssHooks.pageYOffset={get:function(k,c,h){return(c=e.data(k,"__nicescroll")||!1)&&c.ishwscroll?c.getScrollTop():y.call(k)},set:function(k,c){var h=e.data(k,"__nicescroll")||
!1;h&&h.ishwscroll?h.setScrollTop(parseInt(c)):y.call(k,c);return this}};e.fn.scrollTop=function(k){if("undefined"==typeof k){var c=this[0]?e.data(this[0],"__nicescroll")||!1:!1;return c&&c.ishwscroll?c.getScrollTop():y.call(this)}return this.each(function(){var c=e.data(this,"__nicescroll")||!1;c&&c.ishwscroll?c.setScrollTop(parseInt(k)):y.call(e(this),k)})};var C=e.fn.scrollLeft;e.cssHooks.pageXOffset={get:function(k,c,h){return(c=e.data(k,"__nicescroll")||!1)&&c.ishwscroll?c.getScrollLeft():C.call(k)},
set:function(k,c){var h=e.data(k,"__nicescroll")||!1;h&&h.ishwscroll?h.setScrollLeft(parseInt(c)):C.call(k,c);return this}};e.fn.scrollLeft=function(k){if("undefined"==typeof k){var c=this[0]?e.data(this[0],"__nicescroll")||!1:!1;return c&&c.ishwscroll?c.getScrollLeft():C.call(this)}return this.each(function(){var c=e.data(this,"__nicescroll")||!1;c&&c.ishwscroll?c.setScrollLeft(parseInt(k)):C.call(e(this),k)})};var D=function(k){var c=this;this.length=0;this.name="nicescrollarray";this.each=function(d){for(var e=
0,h=0;e<c.length;e++)d.call(c[e],h++);return c};this.push=function(d){c[c.length]=d;c.length++};this.eq=function(d){return c[d]};if(k)for(var h=0;h<k.length;h++){var n=e.data(k[h],"__nicescroll")||!1;n&&(this[this.length]=n,this.length++)}return this};(function(e,c,h){for(var n=0;n<c.length;n++)h(e,c[n])})(D.prototype,"show hide toggle onResize resize remove stop doScrollPos".split(" "),function(e,c){e[c]=function(){var e=arguments;return this.each(function(){this[c].apply(this,e)})}});e.fn.getNiceScroll=
function(k){return"undefined"==typeof k?new D(this):this[k]&&e.data(this[k],"__nicescroll")||!1};e.extend(e.expr[":"],{nicescroll:function(k){return e.data(k,"__nicescroll")?!0:!1}});e.fn.niceScroll=function(k,c){"undefined"!=typeof c||"object"!=typeof k||"jquery"in k||(c=k,k=!1);c=e.extend({},c);var h=new D;"undefined"==typeof c&&(c={});k&&(c.doc=e(k),c.win=e(this));var n=!("doc"in c);n||"win"in c||(c.win=e(this));this.each(function(){var d=e(this).data("__nicescroll")||!1;d||(c.doc=n?e(this):c.doc,
d=new S(c,e(this)),e(this).data("__nicescroll",d));h.push(d)});return 1==h.length?h[0]:h};window.NiceScroll={getjQuery:function(){return e}};e.nicescroll||(e.nicescroll=new D,e.nicescroll.options=J)});