package ir.taskyar.mobile;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.RectF;
import android.graphics.LinearGradient;
import android.graphics.Shader;
import android.os.Bundle;
import android.text.SpannableString;
import android.text.style.StrikethroughSpan;
import android.view.View;
import android.widget.RemoteViews;
import org.json.JSONArray;
import org.json.JSONObject;
import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Date;
import java.util.Locale;
import java.util.TimeZone;

/** Launcher widget; locally persisted, offline, RTL, with task completion and date navigation. */
public final class TaskyarWidgetProvider extends AppWidgetProvider {
  static final String PREFS="daily_tasks_widget";
  static final String STATE_KEY="state_v2";
  static final String WIDGET_PREFS_KEY="appearance_v2";
  private static final String DIRTY_KEY="widget_changed";
  private static final String OFFSET_KEY="day_offset";
  private static final String ACTION_COMPLETE="ir.taskyar.mobile.COMPLETE_TASK";
  private static final String ACTION_NEXT="ir.taskyar.mobile.NEXT_DAY";
  private static final String ACTION_PREV="ir.taskyar.mobile.PREV_DAY";
  private static final int[] ROW_IDS={R.id.task1,R.id.task2,R.id.task3,R.id.task4,R.id.task5};
  @Override public void onUpdate(Context ctx,AppWidgetManager mgr,int[] ids){for(int id:ids)draw(ctx,mgr,id);}
  @Override public void onAppWidgetOptionsChanged(Context ctx,AppWidgetManager mgr,int id,Bundle options){draw(ctx,mgr,id);}
  @Override public void onReceive(Context ctx,Intent intent){
    super.onReceive(ctx,intent);
    String action=intent.getAction();
    if(ACTION_COMPLETE.equals(action))complete(ctx,intent.getStringExtra("taskId"));
    else if(ACTION_NEXT.equals(action) || ACTION_PREV.equals(action)){
      SharedPreferences p=ctx.getSharedPreferences(PREFS,Context.MODE_PRIVATE);
      int offset=p.getInt(OFFSET_KEY,0)+(ACTION_NEXT.equals(action)?1:-1);
      p.edit().putInt(OFFSET_KEY,Math.max(-365,Math.min(365,offset))).apply();
    }else return;
    refresh(ctx);
  }
  static boolean consumeWidgetDirty(Context ctx){
    SharedPreferences p=ctx.getSharedPreferences(PREFS,Context.MODE_PRIVATE);
    boolean dirty=p.getBoolean(DIRTY_KEY,false);
    if(dirty)p.edit().putBoolean(DIRTY_KEY,false).commit();
    return dirty;
  }
  static void refresh(Context ctx){
    AppWidgetManager mgr=AppWidgetManager.getInstance(ctx);
    ComponentName component=new ComponentName(ctx,TaskyarWidgetProvider.class);
    for(int id:mgr.getAppWidgetIds(component))draw(ctx,mgr,id);
  }
  private static void complete(Context ctx,String taskId){
    if(taskId==null || taskId.isEmpty())return;
    SharedPreferences p=ctx.getSharedPreferences(PREFS,Context.MODE_PRIVATE);
    try {
      String data=p.getString(STATE_KEY,"");
      if(data.isEmpty())return;
      JSONObject state=new JSONObject(data);
      JSONArray tasks=state.getJSONArray("tasks");
      JSONArray archive=state.getJSONArray("completedArchive");
      JSONArray remaining=new JSONArray();
      JSONObject match=null;
      for(int i=0;i<tasks.length();i++){
        JSONObject t=tasks.optJSONObject(i);
        if(t==null)continue;
        if(match==null && taskId.equals(t.optString("id")))match=t;
        else remaining.put(t);
      }
      if(match==null)return;
      match.put("completed",true);
      String time=new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSSXXX",Locale.US).format(new Date());
      match.put("completedAt",time);
      match.put("completedJalaliDate",todayJalali());
      JSONArray updatedArchive=new JSONArray();updatedArchive.put(match);
      for(int i=0;i<archive.length();i++)updatedArchive.put(archive.opt(i));
      state.put("tasks",remaining);
      state.put("completedArchive",updatedArchive);
      p.edit().putString(STATE_KEY,state.toString()).putBoolean(DIRTY_KEY,true).commit();
    }catch(Exception ignored){}
  }
  private static PendingIntent action(Context ctx,String action,String taskId,int requestCode){
    Intent intent=new Intent(ctx,TaskyarWidgetProvider.class).setAction(action);
    if(taskId!=null){intent.setData(android.net.Uri.parse("daily-tasks://complete/"+android.net.Uri.encode(taskId)));intent.putExtra("taskId",taskId);}
    return PendingIntent.getBroadcast(ctx,requestCode,intent,PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE);
  }
  private static void draw(Context ctx,AppWidgetManager mgr,int id){
    RemoteViews rv=new RemoteViews(ctx.getPackageName(),R.layout.taskyar_widget);
    SharedPreferences p=ctx.getSharedPreferences(PREFS,Context.MODE_PRIVATE);
    int offset=p.getInt(OFFSET_KEY,0);
    String date=jalaliForOffset(offset);
    JSONObject opts;
    try{opts=new JSONObject(p.getString(WIDGET_PREFS_KEY,"{}"));}catch(Exception ignored){opts=new JSONObject();}
    String initialTheme="light";
    try { initialTheme=new JSONObject(p.getString(STATE_KEY,"{}")).optString("theme","light"); }
    catch(Exception ignored) {}
    String theme=opts.optString("theme",initialTheme);
    boolean light="light".equals(theme) || "glass".equals(theme);
    int fg=light?Color.rgb(15,23,42):Color.WHITE;
    int muted=light?Color.rgb(71,85,105):Color.rgb(203,213,225);
    rv.setImageViewBitmap(R.id.widget_background,background(ctx,theme,opts.optInt("opacity",95)));
    rv.setTextViewText(R.id.widget_title,"کارهای روزانه");
    rv.setTextColor(R.id.widget_title,fg);
    rv.setTextViewText(R.id.widget_date,offset==0?"امروز • "+date:date);
    rv.setTextColor(R.id.widget_date,muted);
    rv.setTextColor(R.id.widget_prev,fg);
    rv.setTextColor(R.id.widget_next,fg);
    rv.setTextColor(R.id.widget_add,fg);
    rv.setOnClickPendingIntent(R.id.widget_prev,action(ctx,ACTION_PREV,null,5));
    rv.setOnClickPendingIntent(R.id.widget_next,action(ctx,ACTION_NEXT,null,6));
    Intent launch=new Intent(ctx,MainActivity.class);
    launch.setFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP|Intent.FLAG_ACTIVITY_SINGLE_TOP);
    PendingIntent open=PendingIntent.getActivity(ctx,0,launch,PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE);
    rv.setOnClickPendingIntent(R.id.widget_title,open);
    Intent add=new Intent(ctx,MainActivity.class).putExtra("openAdd",true);
    add.setFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP|Intent.FLAG_ACTIVITY_SINGLE_TOP);
    PendingIntent openAdd=PendingIntent.getActivity(ctx,2,add,PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE);
    rv.setOnClickPendingIntent(R.id.widget_add,openAdd);
    for(int t:ROW_IDS)rv.setViewVisibility(t,View.GONE);
    int count=0;
    try {
      JSONObject state=new JSONObject(p.getString(STATE_KEY,"{}"));
      JSONArray data=state.optJSONArray("tasks");
      JSONArray archive=state.optJSONArray("completedArchive");
      if(data==null)data=new JSONArray();
      // A previous day also displays archived tasks completed on that day.
      JSONArray total=new JSONArray();
      for(int i=0;i<data.length();i++)total.put(data.opt(i));
      if(offset<0 && archive!=null)for(int i=0;i<archive.length();i++)total.put(archive.opt(i));
      Bundle options=mgr.getAppWidgetOptions(id);
      int height=options.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_HEIGHT,220);
      int maxRows=height<100?1:height<150?2:height<230?3:5;
      for(int i=0;i<total.length() && count<maxRows;i++){
        JSONObject task=total.optJSONObject(i);
        if(task==null)continue;
        boolean done=task.optBoolean("completed",false);
        String taskDate=done?task.optString("completedJalaliDate",task.optString("jalaliDate")):task.optString("jalaliDate");
        if(!date.equals(taskDate))continue;
        String title=task.optString("title","").trim();if(title.isEmpty())continue;
        int viewId=ROW_IDS[count];
        rv.setViewVisibility(viewId,View.VISIBLE);
        SpannableString label=new SpannableString((done?"✓ ":"○ ")+title);
        if(done)label.setSpan(new StrikethroughSpan(),2,label.length(),0);
        rv.setTextViewText(viewId,label);
        String priority=task.optString("priority","medium");
        int color="high".equals(priority)?Color.rgb(244,63,94):
          "low".equals(priority)?Color.rgb(59,130,246):Color.rgb(16,185,129);
        rv.setTextColor(viewId,done?muted:color);
        if(!done)rv.setOnClickPendingIntent(viewId,action(ctx,ACTION_COMPLETE,task.optString("id"),1000+count));
        count++;
      }
    }catch(Exception ignored){}
    if(count==0){
      rv.setViewVisibility(R.id.task1,View.VISIBLE);
      rv.setTextViewText(R.id.task1,"کاری برای این روز ثبت نشده است");
      rv.setTextColor(R.id.task1,muted);
      rv.setOnClickPendingIntent(R.id.task1,open);
    }
    mgr.updateAppWidget(id,rv);
  }
  private static Bitmap background(Context ctx,String theme,int opacity){
    // Keep RemoteViews bitmap under binder transfer size even on very high-DPI devices.
    int w=360,h=280;
    Bitmap bmp=Bitmap.createBitmap(w,h,Bitmap.Config.ARGB_8888);
    Canvas canvas=new Canvas(bmp);
    int from,to;
    switch(theme){
      case "light":from=0xffeff6ff;to=0xffffffff;break;
      case "glass":from=0xffdbeafe;to=0xfff8fafc;break;
      case "amoled":from=0xff000000;to=0xff000000;break;
      case "material":from=0xff312e81;to=0xff0f172a;break;
      default:from=0xff1e293b;to=0xff0f172a;
    }
    Paint paint=new Paint(Paint.ANTI_ALIAS_FLAG);
    paint.setShader(new LinearGradient(0,0,w,h,from,to,Shader.TileMode.CLAMP));
    paint.setAlpha(Math.max(40,Math.min(100,opacity))*255/100);
    canvas.drawRoundRect(new RectF(0,0,w,h),22,22,paint);
    return bmp;
  }
  static String todayJalali(){return jalaliForOffset(0);}
  static String jalaliForOffset(int daysOffset){
    Calendar c=Calendar.getInstance();c.add(Calendar.DAY_OF_MONTH,daysOffset);
    int gy=c.get(Calendar.YEAR),gm=c.get(Calendar.MONTH)+1,gd=c.get(Calendar.DAY_OF_MONTH);
    int[] gdm={0,31,59,90,120,151,181,212,243,273,304,334};
    int jy=gy>1600?979:0;
    gy-=gy>1600?1600:621;
    int gy2=gm>2?gy+1:gy;
    int days=365*gy+(gy2+3)/4-(gy2+99)/100+(gy2+399)/400-80+gd+gdm[gm-1];
    jy+=33*(days/12053);days%=12053;
    jy+=4*(days/1461);days%=1461;
    if(days>365){jy+=(days-1)/365;days=(days-1)%365;}
    int jm,jd;
    if(days<186){jm=1+days/31;jd=1+days%31;}
    else{jm=7+(days-186)/30;jd=1+(days-186)%30;}
    return String.format(Locale.US,"%d/%02d/%02d",jy,jm,jd);
  }
}
