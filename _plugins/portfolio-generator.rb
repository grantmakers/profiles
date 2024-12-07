module Jekyll
    class ProjectPage < Page
        def initialize(site, base, dir, project_data)
            @site = site
            @base = base
            @dir = dir
            @name = "index.html"

            self.process(@name)
            self.read_yaml(File.join(base, "_layouts"), "profile.html")

            project_data.each { |key, value| self.data[key] = value }
        end
    end

    class RedirectPage < Page
        def initialize(site, base, dir, project_data)
            @site = site
            @base = base
            @dir = dir
            @name = "index.html"

            self.process(@name)
            self.read_yaml(File.join(base, "_layouts"), "redirect.html")

            project_data.each { |key, value| self.data[key] = value }
        end
    end

    class PortfolioGenerator < Generator
        safe true

        def generate(site)
            dir = site.config["portfolio_dir"] || "profiles"

            # First get the related projects and add them to each project
            unless site.config["skip_related_projects"] == true
                raise ArgumentError.new "Missing related_project_keys in config file" unless site.config["related_project_keys"]
                compute_related_projects(site)
            end

            # Then generate the project pages
            site.data["ein"].each do |project_file|
                project = project_file[1]

                # Grantmakers.io url scheme
                # /profiles/123456789-some-foundation
                # EIN Redirect: /profiles/123456789
                file_name_slug = (project["ein"] + "-" + project["organization_name_slug"])
                path = File.join(dir, file_name_slug)
                project["dir"] = path

                site.pages << ProjectPage.new(site, site.source, path, project) # Main profile link
                site.pages << RedirectPage.new(site, site.source, project["ein"], project) # EIN redirect

                # Handle Pub78 name changes
                if project["organization_name_legacy_slug_requires_redirect"] == true
                    if project.has_key?("organization_name_legacy_slug")
                        file_name_legacy_slug = (project["ein"] + "-" + project["organization_name_legacy_slug"])
                        path_legacy_name = File.join(dir, file_name_legacy_slug)
                        project["dir"] = path_legacy_name
                        site.pages << RedirectPage.new(site, site.source, path_legacy_name, project)
                    else 
                        # Capture errors from missing legacy-slugs - this should never trigger
                        puts "EIN: #{project["ein"].inspect}"
                        puts "Org name slug: #{project["organization_name_slug"].inspect}"
                        puts "Org name legacy slug: #{project["organization_name_legacy_slug"].inspect}"
                        end
                end

                # Create redirects if name has changed
                date_updated_grantmakers = DateTime.strptime(site.config["last_updated_grantmakers"], '%Y-%m-%dT%H:%M:%S.%N%z').to_s
                date_updated_irs = project["last_updated_irs"]

                if (project["organization_name_prior_year"])
                    if (project["organization_name_prior_year"] != project["organization_name"])

                        # Create basic redirects covering most cases
                        file_name_slug_old_name = slugify(project["ein"] + "-" + project["organization_name_prior_year"])
                        if (file_name_slug != file_name_slug_old_name)
                            path_old_name = File.join(dir, file_name_slug_old_name)
                            project["dir"] = path_old_name
                            site.pages << RedirectPage.new(site, site.source, path_old_name, project)
                        end

                        # Create edge case redirects for previously malformed urls
                        # TODO These can be removed after Google indexes the correct urls (e.g. new slugify method)
                        file_name_slug_old_name_old_slugify = slugify_old_method(project["ein"] + "-" + project["organization_name_prior_year"])
                        if (file_name_slug_old_name != file_name_slug_old_name_old_slugify)
                            path_old_name_old_slugify = File.join(dir, file_name_slug_old_name_old_slugify)
                            project["dir"] = path_old_name_old_slugify

                            # Ensure link is not a duplicate of basic malformed redirect
                            if (file_name_slug_old_name != file_name_slug_old_name_old_slugify)
                                site.pages << RedirectPage.new(site, site.source, path_old_name_old_slugify, project)
                            end
                        end
                    end

                end

                if (project["organization_name_second_prior_year"])
                    if (project["organization_name_second_prior_year"] != project["organization_name_prior_year"])
                        # Create basic redirects covering most cases
                        file_name_slug_old_name = slugify(project["ein"] + "-" + project["organization_name_prior_year"])
                        file_name_slug_oldest_name = slugify(project["ein"] + "-" + project["organization_name_second_prior_year"])
                        if (file_name_slug_old_name != file_name_slug_oldest_name && file_name_slug != file_name_slug_oldest_name)
                            path_oldest_name = File.join(dir, file_name_slug_oldest_name)
                            project["dir"] = path_oldest_name
                            site.pages << RedirectPage.new(site, site.source, path_oldest_name, project)
                        end
                    end
                
                end

                # Fix previously malformed urls that used old slugify method
                # Google has indexed the erroneous form
                # Includes org names with a hyphen and org names with extra spaces
                # TODO These can be removed after Google indexes the correct urls (e.g. new slugify method)
                malformed_url = slugify_old_method(project["ein"] + "-" + project["organization_name"])
                correct_url = slugify(project["ein"] + "-" + project["organization_name"])
                malformed_path = File.join(dir, malformed_url)
                if (malformed_url != correct_url)
                    site.pages << RedirectPage.new(site, site.source, malformed_path, project)
                end
            end
        end

        def slugify(title)
            title.downcase.gsub(/[^\w]/, " ").strip.gsub(/\s+/, '-')
            # Original slugify regex
            #title.downcase.strip.gsub(' ', '-').gsub(/[^\w-]/, '')
        end

        def slugify_old_method(title)
            title.downcase.strip.gsub(' ', '-').gsub(/[^\w-]/, '')
        end

    end

    module ProjectFilter
        def get_projects_from_files(input)
            projects = []
            input.each { |project| projects.push(project[1]) }
            return projects
        end
    end

end

Liquid::Template.register_filter(Jekyll::ProjectFilter)
