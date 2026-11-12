// Isolated research adapter: paired source/target velocity-difference editing.
// Uses installed acestep.cpp primitives and GGUFs; not part of Mana runtime.
static int flowedit_generate(const AceSynth * ctx, SynthState & s, bool (*cancel)(void *), void * data) {
 const char * caption=std::getenv("ACE_FLOW_EDIT_SOURCE_CAPTION");
 if (!caption || !*caption || !s.have_cover || s.T_cover<=0) return -1;
 const bool text_context=std::getenv("ACE_FLOW_EDIT_TEXT_CONTEXT")!=nullptr;
 if(text_context){
  s.instruction_str=DIT_INSTR_TEXT2MUSIC;s.use_source_context=false;
  if(ops_encode_text(ctx,&s.rr,1,s)!=0)return -1;
  for(int t=0;t<s.T;t++)for(int c=0;c<s.Oc;c++){
   s.context[t*s.ctx_ch+c]=ctx->meta->silence_full[t*s.Oc+c];
   s.context[t*s.ctx_ch+s.Oc+c]=1.f;
  }
  fprintf(stderr,"[FlowEdit] text-driven paired field; source retained in clean initialization\n");
 }
 SynthState source_state=s;
 AceRequest source_req=s.rr;source_req.caption=caption;
 if (ops_encode_text(ctx,&source_req,1,source_state)!=0) return -1;
 double enc_delta=0.;
 if(source_state.enc_hidden.size()==s.enc_hidden.size())for(size_t i=0;i<s.enc_hidden.size();i++){double d=source_state.enc_hidden[i]-s.enc_hidden[i];enc_delta+=d*d;}
 fprintf(stderr,"[FlowEdit] captions equal=%d encoder difference %.9f\n",source_req.caption==s.rr.caption,sqrt(enc_delta/(std::max)((size_t)1,s.enc_hidden.size())));
 int H=(int)s.enc_hidden.size()/s.enc_S;
 if ((int)source_state.enc_hidden.size()/source_state.enc_S!=H) return -1;
 int E=(std::max)(s.enc_S,source_state.enc_S), n=s.T*s.Oc;
 std::vector<float> enc((size_t)2*E*H,0.f), context((size_t)2*s.T*s.ctx_ch);
 std::copy(source_state.enc_hidden.begin(),source_state.enc_hidden.end(),enc.begin());
 std::copy(s.enc_hidden.begin(),s.enc_hidden.end(),enc.begin()+(size_t)E*H);
 std::copy(s.context.begin(),s.context.begin()+s.T*s.ctx_ch,context.begin());
 std::copy(context.begin(),context.begin()+s.T*s.ctx_ch,context.begin()+s.T*s.ctx_ch);
 int lengths[2]={source_state.per_enc_S[0],s.per_enc_S[0]};
 std::vector<float> original(n),edited(n),input(2*n),prediction(2*n);
 for(int t=0;t<s.T;t++)for(int c=0;c<s.Oc;c++)
  original[t*s.Oc+c]=t<s.T_cover?s.cover_latents[t*s.Oc+c]:ctx->meta->silence_full[t*s.Oc+c];
 edited=original;
 DiTGGML * model=store_require_dit(ctx->store,ctx->dit_key);
 if(!model)return -1;
 ModelHandle guard(ctx->store,model);
 if(!ctx->params.use_fa)model->use_flash_attn=false;
 const bool averaged=std::getenv("ACE_FLOW_EDIT_AVERAGE")!=nullptr;
 const int steps=averaged?32:16, averages=averaged?4:1;const float top=.75f,bottom=.05f;
 const float guidance=std::getenv("ACE_FLOW_EDIT_GUIDANCE")?5.f:1.f;
 std::vector<float> step_noise(n),delta_sum(n);
 fprintf(stderr,"[FlowEdit] isolated research build; clean source start, paired delta, %d steps\n",steps);
 for(int step=0;step<steps;step++) {
  float t=top+(bottom-top)*step/steps;
  float next=top+(bottom-top)*(step+1)/steps;
  std::fill(delta_sum.begin(),delta_sum.end(),0.f);
  for(int average=0;average<averages;average++) {
   const float * noise=s.noise.data();
   if(averaged){philox_randn(s.rr.seed+1009*(step+1)+7919*average,step_noise.data(),n,true);noise=step_noise.data();}
  for(int i=0;i<n;i++) {
   input[i]=(1.f-t)*original[i]+t*noise[i];
   input[n+i]=input[i]+(edited[i]-original[i]);
  }
  // One Euler endpoint evaluates x0=x_t-t*v; recover each branch's v.
  // Both branches share source context and the same noise realization.
  int rc=dit_ggml_generate(model,input.data(),context.data(),enc.data(),E,s.T,1,1,&t,prediction.data(),guidance,nullptr,nullptr,-1,cancel,data,lengths);
  if(!rc)rc=dit_ggml_generate(model,input.data()+n,context.data()+s.T*s.ctx_ch,enc.data()+E*H,E,s.T,1,1,&t,prediction.data()+n,guidance,nullptr,nullptr,-1,cancel,data,lengths+1);
  if(rc)return rc;
  for(int i=0;i<n;i++) {
   float vs=(input[i]-prediction[i])/t;
   float vt=(input[n+i]-prediction[n+i])/t;
   delta_sum[i]+=(vt-vs)/averages;
  }
  }
  for(int i=0;i<n;i++){edited[i]+=(next-t)*delta_sum[i];if(!std::isfinite(edited[i]))return -1;}
  fprintf(stderr,"[FlowEdit] step %d/%d complete\n",step+1,steps);
 }
 double delta=0.,energy=0.;
 for(int i=0;i<n;i++){double d=edited[i]-original[i];delta+=d*d;energy+=(double)original[i]*original[i];}
 fprintf(stderr,"[FlowEdit] relative latent delta %.9f\n",sqrt(delta/(std::max)(energy,1e-12)));
 s.output=std::move(edited);return 0;
}
