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

    class GrantsPage < Page
        def initialize(site, base, dir, project_data)
            @site = site
            @base = base
            @dir = dir
            @name = "index.json"

            self.process(@name)
            self.read_yaml(File.join(base, "_layouts"), "grants.html")

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
                file_name_slug = slugify(project["ein"] + "-" + project["organization_name"])
                path = File.join(dir, file_name_slug)
                project["dir"] = path

                # Grants JSON: /profiles/123456789/grants
                grants_path = File.join(project["ein"], "grants")


                site.pages << ProjectPage.new(site, site.source, path, project) # Main profile link
                site.pages << RedirectPage.new(site, site.source, project["ein"], project) # EIN redirect

                # Create grants JSON api endpoint if > 50 current year grants
                # if (project["grant_count"] > 50 )
                #    site.pages << GrantsPage.new(site, site.source, grants_path, project)
                # end

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

        def compute_related_projects(site)
            projects = []
            site.data["ein"].each { |project| projects.push(project[1]) }

            keys = site.config["related_project_keys"]

            projects.each do |project|
                project["related_projects"] = []
                min = site.config["related_min_common"] || 0.6

                projects_copy = []

                projects.clone.each do |copy_project|
                    projects_copy.push([copy_project, get_matches(project, copy_project, keys)])
                end

                related = projects_copy.keep_if { |project2| project2[1] >= min }
                related = related.sort { |related_project, related_project2| related_project[1] <=> related_project2[1] }
                related.reverse!.each { |related_project| project["related_projects"].push(related_project[0]) }
            end
        end

        def get_matches(project1, project2, keys)
            total = 0
            total_possible_matches = get_total_possible_matches(project1, keys)

            if project1.to_a == project2.to_a || total_possible_matches == 0
                return total
            else
                keys.each { |key| total += get_num_matches_for_key(project1, project2, key) }
            end

            result = total.fdiv(total_possible_matches).round(2)

            # Uncomment to see info about the matches for each project
            #puts "Matches between #{project1["title"]} and #{project2["title"]}: #{total} (#{result})"

            return result
        end

        def get_total_possible_matches(project, keys)
            total = 0

            keys.each do |key|
                if project[key].class == String
                    total += 1
                else
                    total += project[key].to_a.length()
                end
            end

            return total
        end

        def get_num_matches_for_key(project1, project2, key)
            matches = 0

            if project1[key].kind_of?(Array)
                matches = (project1[key] & project2[key]).length()
            else
                if project1[key] == project2[key]
                    matches += 1
                end
            end

            return matches
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
