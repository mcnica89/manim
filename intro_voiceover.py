%%manim -ql -v  CRITICAL --disable_caching intro
#note that without --disable_caching the voice_over service will have a bug!
#Description:
#Intro scene that starts with dice rolls, and get to the question, But why is the CLT true?


FINAL_MOBJECTS_2=None #global variable used to store the final mobjects for the next scene
GAUSS_CURVE = None
EQN_SIZE_4 = 54

class intro(VoiceoverScene):
    def construct(self):
        
        self.set_speech_service(GTTSService(lang="en", tld="com"))
        #with self.voiceover(text="here is the first text") as tracker:
        #    self.play(Create(Circle()))
            
        #return 0
            
        charts = [None]*6
        for i in range(1,6):
            charts[i] = DICE_HIST[i].copy()
        curve = BELL_CURVE.copy()
        curve.align_to(charts[5],UP)
        
        large_chart_scale = 1.5 #how much bigger to make the chart when its the only thing on the screen
        curve.scale(large_chart_scale)
        for i in range(1,6):
            charts[i].scale(large_chart_scale)
           
        #self.add(charts[1])
        #return 0
        # dice
        n_labels = [MathTex(r"\text{Sum of }","n",r"=",str(n),r"\text{ dice}",tex_to_color_map={"n":N_COLOR},font_size=EQN_SIZE_3).next_to(charts[i],UP) for n in range(6)]
        CLT_title = MathTex(r"\text{The Central Limit Theorem:}",font_size=EQN_SIZE_4)
        CLT_statement = MathTex(r"\text{Any}",r"^*",r"\text{ sum of }","n",r"\text{ random numbers}\approx",r"\text{Gaussian, as }","n",r"\to \infty",font_size=EQN_SIZE_4)
        
        CLT_statement[3].color = N_COLOR
        CLT_statement[6].color = N_COLOR
        CLT_text = VGroup(CLT_title,CLT_statement).arrange(DOWN)
        CLT_underline = Underline(CLT_title)
        CLT_text.add(CLT_underline)
        CLT_bak = SurroundingRectangle(CLT_text,color=GREY_D)
        CLT_text.add(CLT_bak)
        
        CLT_terms_any = CLT_statement[1]
        #CLT_terms_approx = CLT_text[5]
        CLT_statement.remove(CLT_terms_any)
        #CLT_text.remove(CLT_terms_approx)
        
        
        #as }n\to \infty
        #printEnumerate(CLT_text)
        #tiny_dude = Square(color=BLACK,side_length=0.001) 
        small_chart_scale = 0.8
        final_chart = charts[5].copy().scale(1/large_chart_scale*small_chart_scale)
        final_chart[1].remove(final_chart[1][2]) #delete the numbers labels on the final chart
        
        #printEnumerate(final_chart[1])
        
        final_curve = curve.copy().scale(1/large_chart_scale*small_chart_scale)
        final_chart.next_to(CLT_text,UP)
        final_curve.next_to(CLT_text,DOWN)
        #graphs = VGroup(VGroup(final_chart,final_curve).arrange(DOWN),tiny_dude).arrange(RIGHT,buff=0.1)
        
        
        
        n_label_final = MathTex(r"\text{Sum of }","n",r"\text{ dice}",tex_to_color_map={"n":N_COLOR},font_size=EQN_SIZE_4).next_to(final_chart,LEFT)
        z_label = MathTex(r"\text{Gaussian }",tex_to_color_map={"Z":Z_COLOR},font_size=EQN_SIZE_4).next_to(curve,LEFT)
        z_label_final = z_label.copy().next_to(final_curve,LEFT)
        
        DICE_SCALE = 0.95
        plus = MathTex(r"+",font_size=60)
        def sum_of_dice_vgroup(dice_val_list):
            mob_list = []
            for val in dice_val_list:
                mob_list.append(make_dice_face(val).scale(DICE_SCALE))
                mob_list.append(plus.copy())
                
            mob_list.pop() #remove the last plust
            return VGroup(*mob_list).arrange(RIGHT,buff=0.1)
        
        dice_buff = 0.2
        dice_sum = [None]*6
        dice_sum[1] = sum_of_dice_vgroup([3]).to_edge(UP,buff=dice_buff)
        dice_sum[2] = sum_of_dice_vgroup([2,5]).to_edge(UP,buff=dice_buff)
        dice_sum[3] = sum_of_dice_vgroup([3,4,3]).to_edge(UP,buff=dice_buff)
        dice_sum[4] = sum_of_dice_vgroup([6,1,2,5]).to_edge(UP,buff=dice_buff)
        dice_sum[5] = sum_of_dice_vgroup([2,5,1,6,3]).to_edge(UP,buff=dice_buff)
        
        #z_label = MathTexAndColor(r"Z").next_to(curve,LEFT)
        #self.add(n_labels[0])
        
        
        
        
        
        #setup for rolling in the first dice
        ROLL_IN_TIME = 1.5
        ROLL_IN_DISTANCE = 8.0
        SCHEDULE = [5,6,2,6,3] #schedule for the order the dice appear in 
        def my_updater(mob,dt,index):
            mob.total_time_since_updates += dt/ROLL_IN_TIME
            #print( min(len(SCHEDULE)-1,int(len(SCHEDULE)*mob.total_time_since_updates)) )
            if SCHEDULE[ min(len(SCHEDULE)-1,int(len(SCHEDULE)*mob.total_time_since_updates)) ] == mob.die_value:
                mob.set_opacity(1) #mob.total_time_since_updates)
            else:
                mob.set_opacity(0)
            mob.rotate(-2.0*360.0*DEGREES*dt/ROLL_IN_TIME)
            mob.shift(ROLL_IN_DISTANCE*dt/ROLL_IN_TIME*RIGHT)
        
        roll_in_die = [make_dice_face(i+1).scale(DICE_SCALE) for i in range(6)]
        for i in range(6):
            set_new_location(roll_in_die[i],dice_sum[1])
            roll_in_die[i].shift(ROLL_IN_DISTANCE*LEFT)
            
            roll_in_die[i].total_time_since_updates = 0
            
            roll_in_die[i].set_opacity(0)
            roll_in_die[i].add_updater(lambda mob,dt,ix=i:my_updater(mob,dt,ix)) 
            #the last line is based on the weird bug described in https://youtu.be/vUIfNN6Bs_4?t=1017
            
        #-------
        #Animated dice rolling in 
        #-------
        #the strategy is to have all 6 faces rolling together identically
        #the dice updater function turns them on/off at the right moments in time
        my_text = "Imagine rolling an ordinary 6 sided dice."
        with self.voiceover(text=my_text) as tracker:
            for i in range(6):
                self.add(roll_in_die[i])
            self.wait(ROLL_IN_TIME) #this will animate the dice rolling in!
            for i in range(6):
                roll_in_die[i].clear_updaters()
                self.remove(roll_in_die[i])

            self.add(dice_sum[1])
        
        self.wait(DELAY)           
        
        #----
        #Fade in the first chart, then morph from 1,2,3,4,5 dice
        #-----
        my_text = "All 6 outcomes are equally likely, so the distribution is completely flat. "
        with self.voiceover(text=my_text) as tracker:
            self.play(FadeIn(charts[1],shift=DOWN))
        
        
        my_text = "However, if you sum up two independent dice, the distribution is not flat. It's peaked at the most likely outcome of 7."
        with self.voiceover(text=my_text) as tracker:
            self.play(FadeIn(n_labels[2],shift=DOWN),
                          ReplacementTransform(dice_sum[1],dice_sum[2]),
                          ReplacementTransform(charts[1],charts[2]))
        self.wait(DELAY)
        
        my_text = "For a sum of 3 dice, 10 and 11 are the most likely outcomes and the distribution is now rounded at the peak."
        with self.voiceover(text=my_text) as tracker:    
            i=2
            self.play(TransformMatchingTex(n_labels[i],n_labels[i+1]),
                      ReplacementTransform(dice_sum[i],dice_sum[i+1]),
                      ReplacementTransform(charts[i],charts[i+1]))
            self.wait(DELAY)
            
        my_text = "As you add more and more dice, the distribution gets smoother and smoother."
        with self.voiceover(text=my_text) as tracker:
            for i in range(3,5):
                self.play(TransformMatchingTex(n_labels[i],n_labels[i+1]),
                          ReplacementTransform(dice_sum[i],dice_sum[i+1]),
                          ReplacementTransform(charts[i],charts[i+1]))
                self.wait(1)
                
            
       
        #---
        #Fade in the bell curve overtop of the chart, then split into sums vs Gauss
        #-----
        #approx_Z = MathTex(r"\approx",font_size=EQN_SIZE,tex_to_color_map={"Z":Z_COLOR,"n":BLACK})
        #make the n invisible just so that it sizes it to be the same size as the X_n later on
        #approx_Z.next_to(dice_sum[5],RIGHT)
        my_text = "We can see that the distribution is starting to look a lot like the infamous bell curve"
        with self.voiceover(text=my_text) as tracker:
            curve.align_to(charts[5],UP)
            self.play(FadeIn(curve))
            self.wait(DELAY)
        #FadeIn(approx_Z,shift=LEFT),
        
        my_text = "The bell curve is formally known as a Gaussian distribution."
        with self.voiceover(text=my_text) as tracker:
            charts[5].generate_target()
            charts[5].target = final_chart
            #n_labels[5].generate_target()
            #n_labels[5].target = n_label_final
            self.play(MoveToTarget(charts[5]),TransformMatchingTex(n_labels[5],n_label_final),ReplacementTransform(curve,final_curve),FadeIn(z_label_final,shift=DOWN))
            
        my_text = "The idea that a bell curve approximates other distributions is the heart of the central limit theorem"
        with self.voiceover(text=my_text) as tracker:
            self.wait(DELAY)
        
        my_text = "This theorem states that any sum of random numbers gets closer and closer to a Gaussian as the number of terms goes to infinity."    
        with self.voiceover(text=my_text) as tracker:
            final_curve.add(z_label_final)
            self.play(FadeIn(CLT_text,shift=LEFT))
            self.wait(DELAY)
        
        
        my_text="For dice, this is exactly saying that the distribution at the top of the screen gets closer and closer to the Gaussian distribution at the bottom of the screen as we sum up more and more dice."
        with self.voiceover(text=my_text) as tracker:
            self.wait(DELAY)
        
        my_text ="Of course, as with every mathematical theorem, there are specific terms and conditions that apply, but nevertheless this approximation can be incredibly useful. "
        with self.voiceover(text=my_text) as tracker:
            fade_in_list = [CLT_terms_any] #CLT_terms_approx,
            self.play(*[FadeIn(mob,scale=0.1) for mob in fade_in_list])
        #CLT_text.add(CLT_terms_any)
        
        
        my_text = "There is a nice formula for the distribution of Gaussian which just involves e to the minus x squared"
        my_text2 = " By this formula and the central limit theorem, we can easily approximate probabilities for dice rolls."
        
        with self.voiceover(text=my_text+my_text2) as tracker:
            #GaussText = MathTex(r"\text{Gaussian: }",font_size=EQN_SIZE)
            #GaussPDF = MathTexAndColor(r"p_{{Z}}({{x}})=",r" e^{-\frac{1}{2", r"\sigma^2}\bigl(",r" {{x}}","-\mu",r"\bigr)",r"^2}",r"/ {\sqrt{2\pi", r"\sigma^2}}")
            GaussPDF = MathTexAndColor(r"p_{{Z}}({{x}})=",r" e^{-\frac{1}{2", r"} {{x}}^2}",r"/ {\sqrt{2\pi", r"}}")
            #printEnumerate(StandardGaussPDF)
            #printEnumerate(GaussPDF)
            #printEnumerate(GaussPDF)
            #GaussVGroup = VGroup(GaussText,GaussPDF).arrange(RIGHT)
            GaussPDF.to_edge(DOWN) #next_to(graphs,DOWN,buff=0.1)
            #GaussPDF.to_edge(RIGHT,buff=0.2)
            #GaussPDF.to_edge(DOWN,buff=0.1)
            self.play(FadeIn(GaussPDF,shift=DOWN))
            self.wait(DELAY)
            
        my_text="For example, you can use this approximation to calculate that there is approximately a 68% chance that the sum of 5 dice will be somewhere in the range 14 to 21." 
        my_text2 = " But the really amazing thing about the central limit theorem is that it works for ANY random variables, not just dice rolls!"
       
        #", because this range represents one standard deviation around the average of 17.5."
        with self.voiceover(text=my_text+my_text2) as tracker:
            self.wait(DELAY)
        
        my_text = "No matter what distribution X you start with, when you add up independent copies X 1 plus X 2 plus X 3 and so on, the distribution again looks more and more like the same Gaussian bell curve shape as you add more and more terms. "
        with self.voiceover(text=my_text) as tracker:
            #r"\text{Sums: }",r
            X_sum = MathTex("X_1 + X_2 + X_3 +\ldots+X_{{n}}",font_size=EQN_SIZE,tex_to_color_map={"n":N_COLOR})
            X_sum.set_y(dice_sum[5].get_y())

            n_label_final_2 = MathTex(r"\text{Sum of }","n",r"\text{ }X\text{'s}",tex_to_color_map={"n":N_COLOR},font_size=EQN_SIZE_4).next_to(final_chart,LEFT)
            n_label_final_2.next_to(final_chart,LEFT)
            #X_sum.next_to(approx_Z,LEFT)
            self.play(TransformMatchingTex(n_label_final,n_label_final_2),FadeOut(dice_sum[5],shift=DOWN),FadeIn(X_sum,shift=DOWN))
            final_chart.add(n_label_final_2)
        
            self.wait(DELAY)
            
        my_text = "The fact that you get the same final shape no matter what X you start with is truly surprising to me"
        with self.voiceover(text=my_text) as tracker:
            self.wait(DELAY)
            
        my_text="Why does this happen? How is it that the distribution of sums of random variables is somehow forced into the Gaussian distribution? What is so special about the Gaussian distribution that all sums look like it no matter what you start with?" #" that all sums start to look Gaussian? "
        with self.voiceover(text=my_text) as tracker:
            z_label_final.generate_target()
            z_label_final.target.next_to(GaussPDF,LEFT)

            CLT_Q = MathTex(r"\text{But \emph{why} do sums become Gaussian?}",font_size=EQN_SIZE_3).to_edge(LEFT,buff=0.3)

            self.play(FadeOut(CLT_text,CLT_terms_any,shift=DOWN),FadeIn(CLT_Q,shift=DOWN))
            #CLT_text.remove(CLT_statement)
            #CLT_text.remove(CLT_terms_any) 
            #CLT_text.add(CLT_alt_statement)
            self.wait(DELAY)

        #fade_out_list = [n_label_final_2, z_label_final]
        #self.play(*[FadeOut(mob) for mob in fade_out_list])
        #self.wait(DELAY) #insert clips from 3b1b videos here
        
        global FINAL_MOBJECTS_2
        FINAL_MOBJECTS_2 = VGroup(X_sum,GaussPDF,final_chart,final_curve,CLT_Q) #,z_label_final) #save it for the next scene
        
        self.wait(2)
