package text_summarizing

import jakarta.servlet.http.HttpServletResponse
import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.autoconfigure.security.servlet.UserDetailsServiceAutoConfiguration
import org.springframework.boot.runApplication
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.security.authentication.AuthenticationProvider
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.config.Customizer
import org.springframework.security.config.annotation.web.builders.HttpSecurity
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity
import org.springframework.security.core.Authentication
import org.springframework.security.core.userdetails.UsernameNotFoundException
import org.springframework.security.web.SecurityFilterChain


@SpringBootApplication(exclude = [UserDetailsServiceAutoConfiguration::class])
@Configuration
@EnableWebSecurity
class App {
    @Bean
    fun filterChain(http: HttpSecurity, userRep: UserRep): SecurityFilterChain? {
        http
                .authorizeHttpRequests {
                    with(it) {
                        requestMatchers("/api-docs/**", "/swagger-ui.html", "/swagger-ui/**", "/login", "/registration").permitAll()
                        anyRequest().authenticated()
                    }
                }
                .httpBasic(Customizer.withDefaults())

                .authenticationProvider(object : AuthenticationProvider {
                    override fun authenticate(authentication: Authentication?): Authentication {
                        return authentication
                                ?.name
                                ?.let { userRep.findById(it) }
                                ?.map { UsernamePasswordAuthenticationToken(it, null, listOf()) }
                                ?.orElseThrow {
                                    UsernameNotFoundException("User: ${authentication.name}, not found")
                                }
                                ?: throw UsernameNotFoundException("Username is empty")
                    }

                    override fun supports(authentication: Class<*>?): Boolean {
                        return authentication == UsernamePasswordAuthenticationToken::class.java
                    }
                })

                .formLogin()
                .loginPage("/login")
                .successHandler{ _, response, _ -> response.status = HttpServletResponse.SC_OK }
                .failureHandler { _, response, _ -> response.status = HttpServletResponse.SC_FORBIDDEN }
                .permitAll()
                .and()

                .logout()
                .invalidateHttpSession(true)
                .logoutUrl("/logout")
                .and()

                .exceptionHandling()
                .authenticationEntryPoint { _, response, _ -> response.status = HttpServletResponse.SC_UNAUTHORIZED }
                .accessDeniedHandler { _, response, _ -> response.status = HttpServletResponse.SC_FORBIDDEN }
                .and()

                .csrf().disable();
        return http.build()
    }
}

fun main(args: Array<String>) {
    runApplication<App>(*args)
}