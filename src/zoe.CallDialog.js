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
})(jQuery);